/**
 * refresh-author-photo.js — Re-fetches an author portrait from Pexels,
 * skipping B&W photos by checking avg_color channel variance.
 *
 * Usage:
 *   node packages/vps/src/refresh-author-photo.js --avatar linda-torres --domain coveragepriceguide.com
 *   node packages/vps/src/refresh-author-photo.js --avatar james-crawford --domain repairrateguide.com
 */
import 'dotenv/config';
import { createWriteStream, mkdirSync, existsSync, renameSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';

const PEXELS_KEY = process.env.PEXELS_API_KEY;
const WWW_ROOT   = process.env.WWW_ROOT || '/var/www';

// Returns true if avg_color looks like a B&W photo
// (all R,G,B channels within 20 of each other)
function isBlackAndWhite(avgColor) {
  const r = parseInt(avgColor.slice(1, 3), 16);
  const g = parseInt(avgColor.slice(3, 5), 16);
  const b = parseInt(avgColor.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return (max - min) < 20; // low chroma = likely B&W
}

async function fetchColorPortrait(gender, avatar, destDir) {
  if (!PEXELS_KEY) throw new Error('PEXELS_API_KEY not set');

  const queries = [
    `${gender} professional headshot color portrait studio`,
    `${gender} face portrait close up color professional background`,
    `${gender} professional portrait smiling looking at camera`,
  ];

  const imagesDir = join(destDir, 'images');
  if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true });

  const filename = `author-${avatar}.jpg`;
  const destPath = join(imagesDir, filename);
  const tmpPath  = destPath + '.tmp';

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=30&orientation=portrait`,
        { headers: { Authorization: PEXELS_KEY } }
      );
      if (!res.ok) { console.warn(`  Pexels ${res.status} for: ${query}`); continue; }

      const data = await res.json();
      const photos = data.photos || [];
      if (!photos.length) continue;

      // Filter out B&W photos
      const colorPhotos = photos.filter(p => !isBlackAndWhite(p.avg_color));
      console.log(`  Query: "${query}" → ${photos.length} results, ${colorPhotos.length} color`);

      if (!colorPhotos.length) continue;

      // Pick randomly from first 15 color results
      const pool  = colorPhotos.slice(0, 15);
      const photo = pool[Math.floor(Math.random() * pool.length)];
      console.log(`  Selected: Pexels #${photo.id} avg_color=${photo.avg_color}`);

      const imgRes = await fetch(photo.src.medium);
      if (!imgRes.ok) continue;

      await pipeline(imgRes.body, createWriteStream(tmpPath));
      renameSync(tmpPath, destPath);
      console.log(`  ✅ Saved: /images/${filename}`);
      return true;

    } catch (err) {
      console.warn(`  Error for query "${query}": ${err.message}`);
    }
  }
  return false;
}

async function run() {
  const args = process.argv.slice(2);
  const avatar = args[args.indexOf('--avatar') + 1];
  const domain = args[args.indexOf('--domain') + 1];

  if (!avatar || !domain) {
    console.error('Usage: node refresh-author-photo.js --avatar <slug> --domain <domain>');
    process.exit(1);
  }

  // Infer gender from avatar slug
  // Female names heuristic: ends in a/e, or known female slugs
  const femaleNames = ['linda', 'sarah', 'karen', 'rachel', 'jessica', 'emily', 'mary', 'susan'];
  const firstName = avatar.split('-')[0].toLowerCase();
  const gender = femaleNames.includes(firstName) ? 'woman' : 'man';

  const destDir = join(WWW_ROOT, domain);
  console.log(`\n🖼  Refreshing author photo: ${avatar} (${gender}) → ${domain}`);

  const ok = await fetchColorPortrait(gender, avatar, destDir);
  if (!ok) {
    console.error('❌ Could not find a suitable color photo');
    process.exit(1);
  }

  console.log('\nDone. Re-run rerender-articles to pick up the new photo.');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
