import 'dotenv/config';
import { sql } from '@content-network/db';
import { readFileSync } from 'fs';

const dump = readFileSync('/tmp/articles_restore.sql', 'utf-8');

const copyStart = dump.indexOf('COPY public.articles');
const dataStart = dump.indexOf('\n', copyStart) + 1;
const dataEnd = dump.indexOf('\n\\.', dataStart);
const rawData = dump.slice(dataStart, dataEnd);

const COL_ID = 0, COL_SITE_ID = 1, COL_SLUG = 3, COL_CONTENT = 6;

const rows = rawData.split('\n').filter(Boolean);
console.log(`Found ${rows.length} article rows in backup`);

let restored = 0;

for (const row of rows) {
  const cols = row.split('\t');
  const siteId = parseInt(cols[COL_SITE_ID]);
  if (siteId !== 5) continue;

  const id = parseInt(cols[COL_ID]);
  const slug = cols[COL_SLUG];

  // Unescape PostgreSQL COPY format
  let content = cols[COL_CONTENT]
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t');
  // unescape double-backslash last
  content = content.split('\\\\').join('\\');

  // Apply safe fixes only (no ad-removal regex)
  content = content.replace(/src="\/authors\/([^"]+)\.jpg"/g, 'src="/images/author-$1.jpg"');
  content = content.replace(/src="\/authors\/([^"]+)\.webp"/g, 'src="/images/author-$1.webp"');
  content = content.replace(/object-position:top/g, 'object-position:center');

  await sql`UPDATE articles SET content = ${content} WHERE id = ${id}`;
  process.stdout.write(`  restored ${slug} (id:${id})\n`);
  restored++;
}

console.log(`\nDone: ${restored} articles restored`);
process.exit(0);
