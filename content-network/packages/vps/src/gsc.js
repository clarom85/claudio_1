/**
 * Google Search Console — Indexing API
 *
 * Submette automaticamente nuovi URL all'API di indicizzazione di Google.
 * Molto più veloce di aspettare il crawl organico (da settimane a ore).
 *
 * Setup:
 * 1. Google Cloud Console → crea Service Account
 * 2. Scarica JSON credenziali → salva come /opt/content-network/gsc-service-account.json
 * 3. In GSC → Impostazioni → Utenti e autorizzazioni → aggiungi email service account (Owner)
 * 4. Abilita "Web Search Indexing API" nel progetto Google Cloud
 *
 * Env vars:
 *   GSC_SERVICE_ACCOUNT_JSON=/path/to/service-account.json  (o JSON string)
 *
 * Quota: 200 URL/giorno per progetto (gratuito)
 */

import { readFileSync } from 'fs';
import { createSign } from 'crypto';

const GSC_JSON = process.env.GSC_SERVICE_ACCOUNT_JSON;
const INDEXING_API = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

let _credentials = null;

function loadCredentials() {
  if (_credentials) return _credentials;
  if (!GSC_JSON) return null;
  try {
    // Può essere path a file o JSON stringa diretta
    const raw = GSC_JSON.startsWith('{') ? GSC_JSON : readFileSync(GSC_JSON, 'utf-8');
    _credentials = JSON.parse(raw);
    return _credentials;
  } catch (e) {
    console.warn(`[GSC] Cannot load credentials: ${e.message}`);
    return null;
  }
}

/**
 * Genera JWT per Google API auth (Service Account)
 */
function buildJWT(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  })).toString('base64url');

  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(credentials.private_key, 'base64url');

  return `${header}.${payload}.${signature}`;
}

/**
 * Ottieni access token OAuth2 da JWT
 */
async function getAccessToken(credentials) {
  const jwt = buildJWT(credentials);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`GSC auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

/**
 * Submette un singolo URL all'Indexing API.
 * type: 'URL_UPDATED' (nuovo/aggiornato) | 'URL_DELETED'
 */
async function submitUrl(url, token, type = 'URL_UPDATED') {
  const res = await fetch(INDEXING_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url, type })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GSC submit failed for ${url}: ${err}`);
  }
  return res.json();
}

/**
 * Submette batch di URL a GSC.
 * Rispetta quota 200/giorno con delay tra richieste.
 *
 * @param {string[]} urls - Array di URL assoluti
 * @returns {{ submitted: number, skipped: number, errors: string[] }}
 */
export async function submitUrlsToGSC(urls) {
  const result = { submitted: 0, skipped: 0, errors: [] };

  const creds = loadCredentials();
  if (!creds) {
    console.log('[GSC] No credentials configured — skipping submission');
    result.skipped = urls.length;
    return result;
  }

  if (!urls.length) return result;

  let token;
  try {
    token = await getAccessToken(creds);
  } catch (e) {
    result.errors.push(`Auth error: ${e.message}`);
    return result;
  }

  // Max 200/giorno — limita per sicurezza
  const batch = urls.slice(0, 180);

  for (const url of batch) {
    try {
      await submitUrl(url, token);
      result.submitted++;
      // Rispetta rate limit: 60 req/min
      await new Promise(r => setTimeout(r, 1100));
    } catch (e) {
      result.errors.push(e.message);
    }
  }

  if (urls.length > 180) result.skipped = urls.length - 180;

  console.log(`[GSC] Submitted: ${result.submitted}, skipped: ${result.skipped}, errors: ${result.errors.length}`);
  return result;
}

/**
 * Submette tutti gli articoli di un sito pubblicati nelle ultime N ore.
 */
export async function submitSiteNewArticles(domain, articles, hoursBack = 25) {
  const cutoff = new Date(Date.now() - hoursBack * 3600 * 1000);
  const newArticles = articles.filter(a => {
    const date = new Date(a.published_at || a.created_at);
    return date > cutoff && a.status === 'published';
  });

  if (!newArticles.length) return { submitted: 0, skipped: 0, errors: [] };

  const urls = newArticles.map(a => `https://${domain}/${a.slug}/`);
  console.log(`[GSC] Submitting ${urls.length} new URLs for ${domain}`);
  return submitUrlsToGSC(urls);
}
