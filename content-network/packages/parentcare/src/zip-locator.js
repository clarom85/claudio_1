/**
 * zip-locator.js — Resolve US ZIP codes to {city, state} pairs.
 *
 * Strategy:
 *   1. Look up parentcare_zip_cache (Postgres).
 *   2. For ZIPs not cached, fetch in parallel from api.zippopotam.us
 *      (free, no API key, ~50 req/sec rate-limit).
 *   3. Persist new findings to the cache table.
 *
 * Public API:
 *   getZipLocations(zips: string[]) -> { [zip]: { city, state } }
 *   getZipLocation(zip: string)     -> { city, state } | null
 */

import { sql } from '@content-network/db';

const ZIPPOPOTAM_URL = 'https://api.zippopotam.us/us/';
const FETCH_TIMEOUT_MS = 4000;

async function fetchOne(zip) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(`${ZIPPOPOTAM_URL}${zip}`, { signal: controller.signal });
    if (!resp.ok) return null;
    const data = await resp.json();
    const place = data.places?.[0];
    if (!place) return null;
    return {
      zip,
      city: place['place name'] || null,
      state_full: place['state'] || null,
      state_code: place['state abbreviation'] || null,
      county: null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function getZipLocations(zipsRaw) {
  const zips = [...new Set((zipsRaw || []).filter(z => /^\d{5}$/.test(String(z || '').trim())))];
  if (!zips.length) return {};

  const out = {};
  // 1. cache lookup
  const cached = await sql`
    SELECT zip, city, state_code FROM parentcare_zip_cache WHERE zip = ANY(${zips})
  `;
  for (const r of cached) {
    out[r.zip] = { city: r.city, state: r.state_code };
  }

  // 2. fetch missing in parallel (cap at 20 to avoid hammering)
  const missing = zips.filter(z => !out[z]);
  if (!missing.length) return out;

  const chunkSize = 20;
  for (let i = 0; i < missing.length; i += chunkSize) {
    const chunk = missing.slice(i, i + chunkSize);
    const results = await Promise.all(chunk.map(fetchOne));
    for (const r of results) {
      if (!r) continue;
      try {
        await sql`
          INSERT INTO parentcare_zip_cache (zip, city, state_full, state_code, county)
          VALUES (${r.zip}, ${r.city}, ${r.state_full}, ${r.state_code}, ${r.county})
          ON CONFLICT (zip) DO UPDATE SET
            city = EXCLUDED.city,
            state_full = EXCLUDED.state_full,
            state_code = EXCLUDED.state_code,
            fetched_at = NOW()
        `;
      } catch (err) {
        console.warn('[zip-locator] cache insert failed for', r.zip, err.message);
      }
      out[r.zip] = { city: r.city, state: r.state_code };
    }
  }
  return out;
}

export async function getZipLocation(zip) {
  const map = await getZipLocations([zip]);
  return map[zip] || null;
}
