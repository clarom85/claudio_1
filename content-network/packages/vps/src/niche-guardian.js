/**
 * CHIP — Content Health & Improvement Processor
 * Niche Guardian: monitors, diagnoses and auto-fixes publishing pipeline + SEO.
 * Uses Claude Haiku for intelligent content fixes (title rewrite, meta, alt text).
 *
 * Usage : node packages/vps/src/niche-guardian.js --all
 *         node packages/vps/src/niche-guardian.js --niche home-improvement-costs
 * PM2   : cron every 12 hours
 */
import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync, execSync } from 'child_process';
import { sql } from '@content-network/db';
import { alertWarning, alertReport } from '@content-network/vps/src/alert.js';
import { generateSitemap, generateRssFeed } from '@content-network/vps';
import { getCategoriesForNiche } from '@content-network/content-engine/src/categories.js';

// ── Config ────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '../../..');

const args     = process.argv.slice(2);
const ALL_MODE = args.includes('--all');
const nicheArg = args.find(a => a.startsWith('--niche='))?.split('=')[1]
  || (!ALL_MODE && args[args.indexOf('--niche') + 1]);

if (!ALL_MODE && !nicheArg) {
  console.error('Usage: node niche-guardian.js --all  OR  --niche <slug>');
  process.exit(1);
}

const AGENT          = 'CHIP';
const WWW_ROOT       = process.env.WWW_ROOT || '/var/www';
const CHANGELOG_PATH = join(__dirname, 'chip-changelog.json');

// ── Claude Haiku — intelligent content fixes ──────────────────────────────────

/**
 * Calls Claude Haiku for simple text-generation tasks.
 * Used only for content quality fixes: title rewrite, meta description, alt text.
 * Returns null silently if API key not set or call fails.
 */
async function claudeFix(prompt, maxTokens = 120) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || null;
  } catch { return null; }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Tronca un titolo articolo in modo intelligente entro maxLen caratteri.
 * Strategia:
 *  1. Se ha separatore naturale (: — – | ·) e la prima parte è ≥ 35 chars → usa quella
 *  2. Altrimenti tronca all'ultimo spazio prima di maxLen-3 e aggiunge "..."
 */
function truncateTitleSmart(title, maxLen = 62) {
  if (title.length <= maxLen) return title;
  // Tenta separatori naturali
  const separators = [/\s*:\s*/, /\s*[—–]\s*/, /\s*\|\s*/, /\s*·\s*/];
  for (const sep of separators) {
    const parts = title.split(sep);
    if (parts.length >= 2 && parts[0].trim().length >= 35 && parts[0].trim().length <= maxLen) {
      return parts[0].trim();
    }
  }
  // Tronca all'ultimo word boundary
  const cut = title.slice(0, maxLen - 3);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trimEnd() + '...';
}

// ── Logging ───────────────────────────────────────────────────────────────────

const report = { fixes: [], issues: [], warnings: [], stats: {} };

function log(msg)  { console.log(`[${AGENT}] ${msg}`); }
function fix(msg)  { report.fixes.push(msg);    log(`🔧 ${msg}`); }
function issue(msg){ report.issues.push(msg);   log(`⚠️  ${msg}`); }
function warn(msg) { report.warnings.push(msg); log(`💡 ${msg}`); }

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const t0 = Date.now();
  log(`\n${'─'.repeat(60)}`);
  log(`${ALL_MODE ? 'ALL niches' : nicheArg} — ${new Date().toISOString()}`);
  log(`${'─'.repeat(60)}`);

  let sites;
  try {
    sites = ALL_MODE
      ? await sql`
          SELECT s.*, n.slug as niche_slug, n.name as niche_name, n.id as niche_id
          FROM sites s JOIN niches n ON s.niche_id = n.id
          WHERE s.status = 'live'
          ORDER BY s.id
        `
      : await sql`
          SELECT s.*, n.slug as niche_slug, n.name as niche_name, n.id as niche_id
          FROM sites s JOIN niches n ON s.niche_id = n.id
          WHERE n.slug = ${nicheArg} AND s.status = 'live'
          ORDER BY s.id
        `;
  } catch (e) {
    log(`❌ DB error fetching sites: ${e.message}`);
    process.exit(1);
  }

  if (!sites.length) {
    log(ALL_MODE ? 'No live sites found' : `No live sites for niche "${nicheArg}"`);
    process.exit(0);
  }

  log(`Found ${sites.length} live site(s) across ${new Set(sites.map(s => s.niche_slug)).size} niche(s)`);

  for (const site of sites) {
    log(`\n${'─'.repeat(40)}`);
    log(`📍 ${site.domain} [${site.niche_slug}]`);
    try { await checkPublishingPipeline(site); }   catch (e) { warn(`pipeline check failed: ${e.message}`); }
    try { await checkContentQuality(site); }       catch (e) { warn(`content check failed: ${e.message}`); }
    try { await checkArticleSeo(site); }           catch (e) { warn(`seo check failed: ${e.message}`); }
    try { await checkSiteLevel(site); }            catch (e) { warn(`site check failed: ${e.message}`); }
    try { await checkMonetization(site); }         catch (e) { warn(`monetization check failed: ${e.message}`); }
    try { await checkKeywordPipeline(site); }      catch (e) { warn(`keyword check failed: ${e.message}`); }
    try { await autoTriggerRegen(site); }          catch (e) { warn(`auto-regen failed: ${e.message}`); }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  log(`\n${'─'.repeat(60)}`);
  log(`Done in ${elapsed}s — fixes: ${report.fixes.length} | issues: ${report.issues.length} | warnings: ${report.warnings.length}`);

  // Daily report at 09:xx UTC
  if (new Date().getUTCHours() === 9) {
    await sendDailyReport(sites);
  }

  // Alert se ci sono issue critiche
  if (report.issues.length >= 5) {
    try {
      await alertWarning(
        `[${AGENT}] ${report.issues.length} issues across ${sites.length} sites`,
        report.issues.join('\n')
      );
    } catch { /* non critico */ }
  }

  // Salva changelog su disco e pusha su GitHub
  await saveChangelogAndPush();

  process.exit(0);
}

// ── 1. Publishing Pipeline ────────────────────────────────────────────────────

async function checkPublishingPipeline(site) {
  log('  [pipeline] Checking publish queue...');

  // 1a. Stuck in 'processing' > 10 min → reset
  try {
    const stuck = await sql`
      SELECT id FROM publish_queue
      WHERE site_id = ${site.id}
        AND status = 'processing'
        AND updated_at < NOW() - INTERVAL '10 minutes'
    `;
    if (stuck.length) {
      await sql`UPDATE publish_queue SET status = 'pending', updated_at = NOW() WHERE id = ANY(${stuck.map(s => s.id)})`;
      fix(`[${site.domain}] Reset ${stuck.length} stuck processing items`);
    }
  } catch (e) { warn(`pipeline stuck-check failed: ${e.message}`); }

  // 1b. Failed with < 3 attempts → requeue (con delay 5 min)
  try {
    const retriable = await sql`
      SELECT id FROM publish_queue
      WHERE site_id = ${site.id}
        AND status = 'failed'
        AND attempts < 3
    `;
    if (retriable.length) {
      await sql`
        UPDATE publish_queue
        SET status = 'pending', scheduled_for = NOW() + INTERVAL '5 minutes', updated_at = NOW()
        WHERE id = ANY(${retriable.map(r => r.id)})
      `;
      fix(`[${site.domain}] Requeued ${retriable.length} failed items (< 3 attempts)`);
    }
  } catch (e) { warn(`pipeline retry-check failed: ${e.message}`); }

  // 1c. Permanently failed (≥ 3 attempts)
  try {
    const dead = await sql`
      SELECT COUNT(*) as count FROM publish_queue
      WHERE site_id = ${site.id} AND status = 'failed' AND attempts >= 3
    `;
    if (parseInt(dead[0].count) > 0) {
      issue(`[${site.domain}] ${dead[0].count} permanently failed queue items (≥ 3 attempts) — manual check needed`);
    }
  } catch (e) { warn(`pipeline dead-check failed: ${e.message}`); }

  // 1d. Articles marked 'published' but HTML file missing on disk
  try {
    const published = await sql`
      SELECT slug FROM articles WHERE site_id = ${site.id} AND status = 'published'
    `;
    let missing = 0;
    for (const a of published) {
      if (!existsSync(join(WWW_ROOT, site.domain, a.slug, 'index.html'))) missing++;
    }
    if (missing > 0) {
      issue(`[${site.domain}] ${missing} published articles have no HTML file on disk — run rerender-articles`);
    }
  } catch (e) { warn(`pipeline file-check failed: ${e.message}`); }

  // 1e. Queue stats
  try {
    const qStats = await sql`
      SELECT status, COUNT(*) as count
      FROM publish_queue WHERE site_id = ${site.id}
      GROUP BY status
    `;
    const statsMap = Object.fromEntries(qStats.map(r => [r.status, parseInt(r.count)]));
    report.stats[site.domain] = { ...report.stats[site.domain], queue: statsMap };
    log(`  [pipeline] Queue: pending=${statsMap.pending||0} done=${statsMap.done||0} failed=${statsMap.failed||0}`);
  } catch (e) { /* non bloccante */ }
}

// ── 2. Content Quality ────────────────────────────────────────────────────────

async function checkContentQuality(site) {
  log('  [content] Checking content quality...');

  // 2a. Articoli con content NULL o vuoto
  try {
    const empty = await sql`
      SELECT id, slug FROM articles
      WHERE site_id = ${site.id} AND status = 'published'
        AND (content IS NULL OR content NOT LIKE '%</p>%')
    `;
    if (empty.length) {
      issue(`[${site.domain}] ${empty.length} published articles have empty/broken content: ${empty.slice(0,3).map(a => a.slug).join(', ')}`);
    }
  } catch (e) { warn(`content empty-check failed: ${e.message}`); }

  // 2b. Articoli senza immagine — AUTO-FIX via fetchArticleImage
  try {
    const noImg = await sql`
      SELECT a.id, a.slug, a.title, COALESCE(k.keyword, a.slug) as keyword
      FROM articles a
      LEFT JOIN keywords k ON a.keyword_id = k.id
      WHERE a.site_id = ${site.id} AND a.status = 'published'
      AND (a.image IS NULL OR a.image = '')
    `;
    if (noImg.length > 0) {
      const { fetchArticleImage } = await import('@content-network/content-engine/src/image-fetcher.js');
      const destDir = join(WWW_ROOT, site.domain);
      let imgFixed = 0;
      for (const art of noImg) {
        try {
          const imagePath = await fetchArticleImage(
            art.keyword || art.title,
            art.slug,
            destDir,
            { nicheSlug: site.niche_slug, title: art.title }
          );
          if (imagePath) {
            await sql`UPDATE articles SET image = ${imagePath} WHERE id = ${art.id}`;
            fix(`[${site.domain}/${art.slug}] Fetched missing image: ${imagePath}`);
            imgFixed++;
          } else {
            issue(`[${site.domain}/${art.slug}] Image fetch failed (all sources exhausted)`);
          }
        } catch (e) {
          issue(`[${site.domain}/${art.slug}] Image fetch error: ${e.message}`);
        }
      }
      if (imgFixed > 0) {
        const rerenderScript = join(ROOT, 'packages/vps/src/rerender-articles.js');
        spawnSync('node', [rerenderScript, '--site-id', String(site.id)], {
          stdio: 'pipe', timeout: 300000, cwd: ROOT
        });
        fix(`[${site.domain}] Re-rendered ${imgFixed} article(s) after image fix`);
      }
    }
  } catch (e) { warn(`content image-check failed: ${e.message}`); }

  // 2c. Immagini referenziate nel DB ma file non presente su disco — AUTO-FIX via re-fetch
  try {
    const withImg = await sql`
      SELECT a.id, a.slug, a.image, COALESCE(k.keyword, a.slug) as keyword, a.title
      FROM articles a LEFT JOIN keywords k ON a.keyword_id = k.id
      WHERE a.site_id = ${site.id} AND status = 'published' AND a.image IS NOT NULL AND a.image != ''
    `;
    let missingFiles = 0;
    let missingWebp  = 0;
    const toRefetch = [];
    for (const a of withImg) {
      const imgPath = join(WWW_ROOT, site.domain, a.image);
      if (!existsSync(imgPath)) {
        missingFiles++;
        toRefetch.push(a);
        continue;
      }
      // Controlla WebP — generato da cwebp durante post-processing
      const webpPath = imgPath.replace(/\.jpg$/i, '.webp');
      if (!existsSync(webpPath)) {
        // Auto-fix: genera WebP mancante
        try {
          spawnSync('cwebp', ['-q', '82', '-quiet', imgPath, '-o', webpPath], { timeout: 15000 });
          if (existsSync(webpPath)) {
            fix(`[${site.domain}] Generated missing WebP: ${webpPath}`);
          }
        } catch { missingWebp++; }
      }
      // Controlla dimensione JPG > 200KB → ri-comprimi
      try {
        const stat = statSync(imgPath);
        if (stat.size > 204800) {
          spawnSync('jpegoptim', ['--strip-all', '--max=82', '--quiet', imgPath], { timeout: 10000 });
          fix(`[${site.domain}] Recompressed oversized image: ${a.image}`);
        }
      } catch { /* jpegoptim non installato */ }
    }
    if (missingWebp > 0)  warn(`[${site.domain}] ${missingWebp} images could not generate WebP (cwebp unavailable?)`);
    // AUTO-FIX: re-scarica immagini che erano in DB ma non su disco
    if (toRefetch.length > 0) {
      issue(`[${site.domain}] ${missingFiles} article images referenced in DB but missing on disk — attempting re-fetch`);
      const { fetchArticleImage } = await import('@content-network/content-engine/src/image-fetcher.js');
      const destDir = join(WWW_ROOT, site.domain);
      let imgFixed = 0;
      for (const art of toRefetch) {
        try {
          const newPath = await fetchArticleImage(
            art.keyword || art.title,
            art.slug,
            destDir,
            { nicheSlug: site.niche_slug, title: art.title }
          );
          if (newPath) {
            if (newPath !== art.image) {
              await sql`UPDATE articles SET image = ${newPath} WHERE id = ${art.id}`;
            }
            fix(`[${site.domain}/${art.slug}] Re-fetched missing image: ${newPath}`);
            imgFixed++;
          } else {
            warn(`[${site.domain}/${art.slug}] Image re-fetch failed (all sources exhausted)`);
          }
        } catch (e) {
          warn(`[${site.domain}/${art.slug}] Image re-fetch error: ${e.message}`);
        }
      }
      if (imgFixed > 0) {
        const rerenderScript = join(ROOT, 'packages/vps/src/rerender-articles.js');
        spawnSync('node', [rerenderScript, '--site-id', String(site.id)], {
          stdio: 'pipe', timeout: 300000, cwd: ROOT
        });
        fix(`[${site.domain}] Re-rendered articles after re-fetching ${imgFixed} missing image(s)`);
      }
    }
  } catch (e) { warn(`content file-check failed: ${e.message}`); }

  // 2d. Schema markup NULL per articoli pubblicati
  try {
    const noSchema = await sql`
      SELECT COUNT(*) as count FROM articles
      WHERE site_id = ${site.id} AND status = 'published'
        AND (schema_markup IS NULL OR schema_markup = '[]' OR schema_markup = '')
    `;
    const count = parseInt(noSchema[0].count);
    if (count > 0) warn(`[${site.domain}] ${count} articles with empty schema_markup`);
  } catch (e) { /* non bloccante */ }
}

// ── 3. Per-Article SEO (legge HTML da disco) ─────────────────────────────────

async function checkArticleSeo(site) {
  log('  [seo] Checking per-article SEO...');

  let articles;
  try {
    articles = await sql`
      SELECT a.id, a.slug, a.title, a.meta_description, a.published_at,
             COALESCE(k.keyword, a.slug) as keyword
      FROM articles a
      LEFT JOIN keywords k ON a.keyword_id = k.id
      WHERE a.site_id = ${site.id} AND a.status = 'published'
      ORDER BY a.published_at DESC
      LIMIT 150
    `;
  } catch (e) { warn(`seo article-fetch failed: ${e.message}`); return; }

  const seoStats = {
    checked: 0, titleBad: 0, metaBad: 0, noCanonical: 0,
    noOg: 0, h1Issues: 0, h2Low: 0, noAlt: 0, schemaInvalid: 0,
    lowWordCount: 0, noInternalLinks: 0, autoFixed: 0
  };

  for (const article of articles) {
    const htmlPath = join(WWW_ROOT, site.domain, article.slug, 'index.html');
    if (!existsSync(htmlPath)) continue;

    let html;
    try { html = readFileSync(htmlPath, 'utf-8'); } catch { continue; }
    seoStats.checked++;

    let modified = false;

    // ── 3a. Title tag ─────────────────────────────────────────────────────
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    if (!titleMatch) {
      issue(`[${site.domain}/${article.slug}] Missing <title> tag`);
      seoStats.titleBad++;
    } else {
      const fullTitle = titleMatch[1].trim();
      const len = fullTitle.length;
      if (len < 30) {
        warn(`[${site.domain}/${article.slug}] Title too short (${len} chars)`);
        seoStats.titleBad++;
      } else if (len > 65) {
        // AUTO-FIX: estrai parte articolo (prima del " | SiteName"), poi prova Claude → fallback truncation
        const pipeIdx = fullTitle.lastIndexOf(' | ');
        const articlePart = pipeIdx > 0 ? fullTitle.slice(0, pipeIdx) : fullTitle;
        const siteSuffix  = pipeIdx > 0 ? fullTitle.slice(pipeIdx) : '';
        const maxArticleLen = 65 - siteSuffix.length;

        let truncated = await claudeFix(
          `Rewrite this article title to be under ${maxArticleLen} characters, keeping the main keyword and topic. Return ONLY the rewritten title, no quotes, no explanation:\n${articlePart}`,
          80
        );
        // Se Claude non risponde o il risultato è ancora troppo lungo → fallback smart truncation
        if (!truncated || truncated.length > maxArticleLen || truncated.length < 20) {
          truncated = truncateTitleSmart(articlePart, maxArticleLen);
        }
        const newTitle = truncated + siteSuffix;

        // Patch HTML: <title>, og:title, twitter:title
        html = html.replace(/<title>[^<]*<\/title>/i, `<title>${newTitle}</title>`);
        html = html.replace(/(property="og:title"\s+content=")[^"]*(")/i,   `$1${truncated}$2`);
        html = html.replace(/(content=")[^"]*("\s+property="og:title")/i,   `$1${truncated}$2`);
        html = html.replace(/(name="twitter:title"\s+content=")[^"]*(")/i,  `$1${truncated}$2`);
        html = html.replace(/(content=")[^"]*("\s+name="twitter:title")/i,  `$1${truncated}$2`);

        // Aggiorna DB (solo la parte articolo, senza " | SiteName")
        try {
          await sql`UPDATE articles SET title = ${truncated} WHERE id = ${article.id}`;
        } catch (e) { warn(`title DB update failed for ${article.slug}: ${e.message}`); }

        fix(`[${site.domain}/${article.slug}] Title truncated: "${articlePart.slice(0,50)}..." → ${truncated.length} chars`);
        seoStats.titleBad++;
        seoStats.autoFixed++;
        modified = true;
      }
    }

    // ── 3b. Meta description ──────────────────────────────────────────────
    const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)
      || html.match(/<meta\s+content="([^"]*)"\s+name="description"/i);
    if (!metaMatch) {
      issue(`[${site.domain}/${article.slug}] Missing meta description`);
      seoStats.metaBad++;
    } else {
      const len = metaMatch[1].trim().length;
      if (len < 100) { warn(`[${site.domain}/${article.slug}] Meta description too short (${len} chars)`); seoStats.metaBad++; }
      if (len > 160) {
        // AUTO-FIX: tronca a 157 chars + "..."
        const truncated = metaMatch[1].trim().slice(0, 157) + '...';
        html = html.replace(metaMatch[0], metaMatch[0].replace(metaMatch[1], truncated));
        fix(`[${site.domain}/${article.slug}] Truncated meta description (${len}→160 chars)`);
        seoStats.metaBad++;
        seoStats.autoFixed++;
        modified = true;
      }
    }

    // ── 3c. Canonical URL ─────────────────────────────────────────────────
    const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
    if (!canonicalMatch) {
      issue(`[${site.domain}/${article.slug}] Missing canonical tag`);
      seoStats.noCanonical++;
      // AUTO-FIX: inietta canonical prima di </head>
      const expectedCanonical = `https://${site.domain}/${article.slug}/`;
      html = html.replace('</head>', `  <link rel="canonical" href="${expectedCanonical}">\n</head>`);
      fix(`[${site.domain}/${article.slug}] Injected missing canonical tag`);
      seoStats.autoFixed++;
      modified = true;
    } else {
      const expected = `https://${site.domain}/${article.slug}/`;
      if (!canonicalMatch[1].endsWith(`/${article.slug}/`)) {
        warn(`[${site.domain}/${article.slug}] Canonical mismatch: ${canonicalMatch[1]}`);
      }
    }

    // ── 3d. Open Graph tags ───────────────────────────────────────────────
    const hasOgTitle = /property="og:title"/i.test(html);
    const hasOgDesc  = /property="og:description"/i.test(html);
    const hasOgImg   = /property="og:image"/i.test(html);
    if (!hasOgTitle || !hasOgDesc || !hasOgImg) {
      warn(`[${site.domain}/${article.slug}] Incomplete OG tags (title=${hasOgTitle} desc=${hasOgDesc} img=${hasOgImg})`);
      seoStats.noOg++;
    }

    // ── 3e. Twitter Card ──────────────────────────────────────────────────
    if (!/name="twitter:card"/i.test(html)) {
      // AUTO-FIX: aggiungi twitter card summary_large_image
      const twitterTags = `  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="${(article.title || '').replace(/"/g, '&quot;')}">\n  <meta name="twitter:description" content="${(article.meta_description || '').slice(0, 160).replace(/"/g, '&quot;')}">\n`;
      html = html.replace('</head>', twitterTags + '</head>');
      fix(`[${site.domain}/${article.slug}] Injected missing Twitter Card tags`);
      seoStats.autoFixed++;
      modified = true;
    }

    // ── 3f. H1 count — deve essere esattamente 1 ─────────────────────────
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    if (h1Count === 0) {
      issue(`[${site.domain}/${article.slug}] Missing H1`);
      seoStats.h1Issues++;
    } else if (h1Count > 1) {
      issue(`[${site.domain}/${article.slug}] Double H1 (${h1Count} found) — run rerender-articles`);
      seoStats.h1Issues++;
    }

    // ── 3g. H2 count — minimo 3 per articolo ─────────────────────────────
    const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
    if (h2Count < 3) {
      warn(`[${site.domain}/${article.slug}] Low H2 count (${h2Count}) — article may need more sections`);
      seoStats.h2Low++;
    }

    // ── 3h. Alt text sulle immagini ───────────────────────────────────────
    const imgTags   = html.match(/<img[^>]+>/gi) || [];
    const noAltImgs = imgTags.filter(t => !/alt\s*=\s*"[^"]+"/i.test(t) && !/alt\s*=\s*'[^']+'/i.test(t));
    if (noAltImgs.length > 0) {
      // AUTO-FIX: inietta alt con titolo articolo per immagini hero senza alt
      let patchedHtml = html;
      let altFixed = 0;
      for (const imgTag of noAltImgs) {
        // Solo immagini hero (contengono /images/) — skip icone/avatar
        if (/src="\/images\//i.test(imgTag)) {
          const altText = (article.title || article.keyword || 'home improvement').replace(/"/g, '&quot;');
          const fixed = imgTag.replace(/<img/i, `<img alt="${altText}"`);
          patchedHtml = patchedHtml.replace(imgTag, fixed);
          altFixed++;
        }
      }
      if (altFixed > 0) {
        html = patchedHtml;
        fix(`[${site.domain}/${article.slug}] Added alt text to ${altFixed} image(s)`);
        seoStats.autoFixed++;
        modified = true;
      }
      if (noAltImgs.length - altFixed > 0) {
        warn(`[${site.domain}/${article.slug}] ${noAltImgs.length - altFixed} non-hero images missing alt text`);
        seoStats.noAlt++;
      }
    }

    // ── 3i. JSON-LD Schema Markup ─────────────────────────────────────────
    const schemaMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
    if (schemaMatches.length === 0) {
      issue(`[${site.domain}/${article.slug}] No JSON-LD schema found`);
      seoStats.schemaInvalid++;
    } else {
      for (const block of schemaMatches) {
        try {
          const jsonContent = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
          JSON.parse(jsonContent); // valida parsing
        } catch {
          issue(`[${site.domain}/${article.slug}] Invalid JSON-LD schema (parse error)`);
          seoStats.schemaInvalid++;
        }
      }
    }

    // ── 3j. Word count nel content ────────────────────────────────────────
    const bodyMatch = html.match(/itemprop="articleBody"[^>]*>([\s\S]*?)<\/div>\s*<aside/);
    if (bodyMatch) {
      const textOnly = bodyMatch[1].replace(/<[^>]+>/g, ' ');
      const wordCount = textOnly.trim().split(/\s+/).filter(w => w.length > 2).length;
      if (wordCount < 600) {
        warn(`[${site.domain}/${article.slug}] Low word count (${wordCount} words)`);
        seoStats.lowWordCount++;
      }
    }

    // ── 3k. Internal links nel content ───────────────────────────────────
    const internalLinks = (html.match(new RegExp(`href="https://${site.domain}/[^"]+/[^"]*"`, 'gi')) || []).length;
    if (internalLinks === 0) {
      warn(`[${site.domain}/${article.slug}] No internal links — consider relink pass`);
      seoStats.noInternalLinks++;
    }

    // ── 3l. datePublished / dateModified in schema ────────────────────────
    if (!/datePublished/i.test(html)) {
      warn(`[${site.domain}/${article.slug}] Missing datePublished in schema`);
    }

    // ── Scrivi HTML patchato se modificato ────────────────────────────────
    if (modified) {
      try {
        writeFileSync(htmlPath, html, 'utf-8');
      } catch (e) {
        warn(`[${site.domain}/${article.slug}] Could not write patched HTML: ${e.message}`);
      }
    }
  }

  // Riepilogo SEO
  log(`  [seo] Checked ${seoStats.checked} articles — auto-fixed: ${seoStats.autoFixed}`);
  if (seoStats.h1Issues > 0)      issue(`[${site.domain}] H1 issues: ${seoStats.h1Issues} articles`);
  if (seoStats.noCanonical > 0)   log(`  [seo] ✅ Canonical injected: ${seoStats.noCanonical} articles`);
  if (seoStats.schemaInvalid > 0) issue(`[${site.domain}] Invalid schema: ${seoStats.schemaInvalid} articles`);
  if (seoStats.metaBad > 3)       warn(`[${site.domain}] ${seoStats.metaBad} articles with meta description issues`);
  if (seoStats.h2Low > 5)         warn(`[${site.domain}] ${seoStats.h2Low} articles with fewer than 3 H2s`);
  if (seoStats.noInternalLinks > 5) warn(`[${site.domain}] ${seoStats.noInternalLinks} articles without internal links`);

  report.stats[site.domain] = { ...report.stats[site.domain], seo: seoStats };
}

// ── 4. Site-Level SEO ─────────────────────────────────────────────────────────

async function checkSiteLevel(site) {
  log('  [site] Checking site-level SEO...');
  const siteDir = join(WWW_ROOT, site.domain);

  // 4a. Homepage esiste e non è vuota
  const homePath = join(siteDir, 'index.html');
  if (!existsSync(homePath)) {
    issue(`[${site.domain}] Homepage missing — run regenerate-homepage`);
  } else {
    const size = statSync(homePath).size;
    if (size < 5000) issue(`[${site.domain}] Homepage suspiciously small (${size} bytes)`);
  }

  // 4b. sitemap.xml — esiste e contiene tutti gli articoli pubblicati
  const sitemapPath = join(siteDir, 'sitemap.xml');
  if (!existsSync(sitemapPath)) {
    issue(`[${site.domain}] sitemap.xml missing — regenerating...`);
    await regenerateSitemap(site);
  } else {
    try {
      const sitemap = readFileSync(sitemapPath, 'utf-8');
      const sitemapUrls = (sitemap.match(/<loc>([^<]+)<\/loc>/g) || []).length;
      const publishedCount = await sql`SELECT COUNT(*) as count FROM articles WHERE site_id = ${site.id} AND status = 'published'`;
      const expected = parseInt(publishedCount[0].count);
      // Sitemap include articoli + pagine statiche; se meno degli articoli → problema
      if (sitemapUrls < expected) {
        warn(`[${site.domain}] Sitemap has ${sitemapUrls} URLs but ${expected} articles published — regenerating`);
        await regenerateSitemap(site);
      } else {
        log(`  [site] Sitemap OK (${sitemapUrls} URLs)`);
      }
    } catch (e) { warn(`sitemap-check failed: ${e.message}`); }
  }

  // 4c. robots.txt — esiste e contiene riferimento a sitemap
  const robotsPath = join(siteDir, 'robots.txt');
  if (!existsSync(robotsPath)) {
    issue(`[${site.domain}] robots.txt missing`);
    // AUTO-FIX: crea robots.txt base
    const robotsContent = `User-agent: *\nAllow: /\nSitemap: https://${site.domain}/sitemap.xml\n`;
    writeFileSync(robotsPath, robotsContent, 'utf-8');
    fix(`[${site.domain}] Created missing robots.txt`);
  } else {
    const robots = readFileSync(robotsPath, 'utf-8');
    if (!robots.includes('Sitemap:')) {
      const updated = robots.trimEnd() + `\nSitemap: https://${site.domain}/sitemap.xml\n`;
      writeFileSync(robotsPath, updated, 'utf-8');
      fix(`[${site.domain}] Added Sitemap reference to robots.txt`);
    }
    // Controlla solo "Disallow: /" esatto su riga propria (non /api/ o /wp-admin/)
    if (/^Disallow:\s*\/\s*$/m.test(robots)) {
      issue(`[${site.domain}] robots.txt blocks all crawlers (Disallow: /) — check immediately`);
    }
  }

  // 4d. feed.xml (RSS) — esiste
  if (!existsSync(join(siteDir, 'feed.xml'))) {
    warn(`[${site.domain}] feed.xml missing — run regenerate-homepage`);
  }

  // 4e. ads.txt — se ADSENSE_ID configurato
  if (process.env.ADSENSE_ID && !existsSync(join(siteDir, 'ads.txt'))) {
    warn(`[${site.domain}] ads.txt missing despite ADSENSE_ID being set`);
  }

  // 4f. Tool/calculator page — per nicchie con tool config
  try {
    const { TOOL_CONFIGS } = await import('@content-network/content-engine/src/tools/tool-configs.js');
    const toolConfig = TOOL_CONFIGS[site.niche_slug];
    if (toolConfig) {
      const toolPath = join(siteDir, 'tools', toolConfig.slug, 'index.html');
      if (!existsSync(toolPath)) {
        issue(`[${site.domain}] Tool page missing: /tools/${toolConfig.slug}/ — run regenerate-tools`);
      } else {
        const toolHtml = readFileSync(toolPath, 'utf-8');
        if (toolHtml.length < 5000) issue(`[${site.domain}] Tool page suspiciously small`);
        else log(`  [site] Tool page OK (/tools/${toolConfig.slug}/)`);
      }
    }
  } catch { /* tool-configs non disponibile */ }

  // 4g. Pagine editoriali chiave
  const editorialPages = ['about', 'privacy', 'contact'];
  for (const page of editorialPages) {
    if (!existsSync(join(siteDir, page, 'index.html'))) {
      warn(`[${site.domain}] /${page}/ missing — run regenerate-static-pages`);
    }
  }

  // 4h. 404.html
  if (!existsSync(join(siteDir, '404.html'))) {
    warn(`[${site.domain}] 404.html missing`);
  }

  // 4i. Homepage meta-SEO check
  if (existsSync(homePath)) {
    const homeHtml = readFileSync(homePath, 'utf-8');
    if (!/rel="canonical"/i.test(homeHtml)) {
      warn(`[${site.domain}] Homepage missing canonical tag`);
    }
    if (!/application\/ld\+json/i.test(homeHtml)) {
      warn(`[${site.domain}] Homepage missing JSON-LD schema`);
    }
    if (!/property="og:title"/i.test(homeHtml)) {
      warn(`[${site.domain}] Homepage missing OG tags`);
    }
    // GSC verification tag — supports comma-separated multi-site keys
    const gsv = process.env.GOOGLE_SITE_VERIFICATION;
    if (gsv) {
      const missing = gsv.split(',').map(k => k.trim()).filter(k => k && !homeHtml.includes(k));
      if (missing.length > 0) warn(`[${site.domain}] Google Site Verification tag missing from homepage`);
    }
  }
}

// ── 5. Keyword Pipeline ───────────────────────────────────────────────────────

async function checkKeywordPipeline(site) {
  log('  [keywords] Checking keyword pipeline...');
  try {
    const remaining = await sql`
      SELECT COUNT(*) as count FROM keywords
      WHERE niche_id = ${site.niche_id} AND used = false
    `;
    const count = parseInt(remaining[0].count);
    report.stats[site.domain] = { ...report.stats[site.domain], keywordsRemaining: count };

    if (count === 0)   issue(`[${site.domain}] CRITICAL: zero keywords remaining — publishing will stall`);
    else if (count < 30)  issue(`[${site.domain}] Critical keyword shortage: only ${count} left`);
    else if (count < 100) warn(`[${site.domain}] Low keywords: ${count} remaining (< 100)`);
    else if (count < 200) warn(`[${site.domain}] Keywords below threshold: ${count} remaining (< 200)`);
    else log(`  [keywords] OK — ${count} keywords remaining`);
  } catch (e) { warn(`keyword-check failed: ${e.message}`); }

  // Articoli pubblicati oggi
  try {
    const today = await sql`
      SELECT COUNT(*) as count FROM articles
      WHERE site_id = ${site.id}
        AND status = 'published'
        AND published_at > NOW() - INTERVAL '24 hours'
    `;
    report.stats[site.domain] = { ...report.stats[site.domain], publishedToday: parseInt(today[0].count) };
    log(`  [keywords] Articles published today: ${today[0].count}`);
  } catch { /* non bloccante */ }
}

// ── 5b. Monetization & Broken Links ──────────────────────────────────────────

async function checkMonetization(site) {
  log('  [money] Checking monetization & links...');
  const siteDir  = join(WWW_ROOT, site.domain);
  const homePath = join(siteDir, 'index.html');
  const monStats = { brokenLinks: 0, missingAds: 0, clsIssues: 0, fixedCls: 0 };

  // ── a. AdSense ──────────────────────────────────────────────────────────
  const adsenseId = process.env.ADSENSE_ID;
  if (adsenseId && existsSync(homePath)) {
    const homeHtml = readFileSync(homePath, 'utf-8');
    if (!homeHtml.includes('pagead2.googlesyndication.com')) {
      issue(`[${site.domain}] AdSense script missing from homepage — check layout.js`);
      monStats.missingAds++;
    } else if (!homeHtml.includes(adsenseId)) {
      issue(`[${site.domain}] AdSense publisher ID (${adsenseId}) not found in homepage`);
      monStats.missingAds++;
    }
    // ads.txt
    if (!existsSync(join(siteDir, 'ads.txt'))) {
      issue(`[${site.domain}] ads.txt missing despite ADSENSE_ID — run generate-ads-txt`);
      monStats.missingAds++;
    } else {
      const adsTxt = readFileSync(join(siteDir, 'ads.txt'), 'utf-8');
      if (!adsTxt.includes(adsenseId.replace('ca-pub-', ''))) {
        warn(`[${site.domain}] ads.txt does not contain publisher ID`);
      }
    }
  }

  // ── b. MGID ─────────────────────────────────────────────────────────────
  const mgidSiteId = process.env.MGID_SITE_ID || site.mgid_site_id;
  if (mgidSiteId && existsSync(homePath)) {
    const homeHtml = readFileSync(homePath, 'utf-8');
    if (!homeHtml.includes('jsc.mgid.com') && !homeHtml.includes('cm.mgid.com')) {
      issue(`[${site.domain}] MGID loader script missing from homepage`);
      monStats.missingAds++;
    }
  }

  // ── c. Ad container min-height (CLS prevention) ──────────────────────
  // Campiona fino a 5 articoli per verifica CLS
  let articles;
  try {
    articles = await sql`
      SELECT slug FROM articles WHERE site_id = ${site.id} AND status = 'published'
      ORDER BY published_at DESC LIMIT 5
    `;
  } catch { articles = []; }

  for (const a of articles) {
    const htmlPath = join(siteDir, a.slug, 'index.html');
    if (!existsSync(htmlPath)) continue;
    try {
      let html = readFileSync(htmlPath, 'utf-8');
      let changed = false;

      // Inline ads senza min-height → CLS
      const adInlineNoHeight = html.match(/class="ad[^"]*ad-inline[^"]*"(?![^>]*min-height)[^>]*style="(?![^"]*min-height)[^"]*"/);
      if (adInlineNoHeight) {
        warn(`[${site.domain}/${a.slug}] Ad inline container missing min-height (CLS risk)`);
        monStats.clsIssues++;
      }

      // Controlla che i data-ad-slot abbiano formato valido (solo cifre)
      const adSlots = html.match(/data-ad-slot="([^"]*)"/g) || [];
      for (const slot of adSlots) {
        const val = slot.match(/data-ad-slot="([^"]*)"/)?.[1];
        if (val && !/^\d+$/.test(val)) {
          issue(`[${site.domain}/${a.slug}] Invalid data-ad-slot value: "${val}"`);
          monStats.missingAds++;
        }
      }

      if (changed) writeFileSync(htmlPath, html, 'utf-8');
    } catch { /* skip */ }
  }

  // ── d. Broken internal links (file existence check) ──────────────────
  let allArticles;
  try {
    allArticles = await sql`
      SELECT slug FROM articles WHERE site_id = ${site.id} AND status = 'published'
    `;
  } catch { allArticles = []; }

  const publishedSlugs = new Set(allArticles.map(a => a.slug));
  const brokenDetails  = [];

  for (const a of allArticles) {
    const htmlPath = join(siteDir, a.slug, 'index.html');
    if (!existsSync(htmlPath)) continue;
    try {
      const html     = readFileSync(htmlPath, 'utf-8');
      // Solo link interni relativi (href="/slug/") — esclude ancore, api, external
      const linkRe   = /href="\/([a-z0-9][a-z0-9\-\/]*)\/?"/gi;
      let m;
      while ((m = linkRe.exec(html)) !== null) {
        const target = m[1].replace(/\/$/, '').split('/')[0]; // prendi solo il primo segmento
        if (!target || target === 'api' || target === 'category' || target === 'tag'
            || target === 'tools' || target === 'authors' || target === 'author' || target === 'images') continue;
        // Verifica che la pagina target esista su disco
        if (!existsSync(join(siteDir, target, 'index.html')) && !existsSync(join(siteDir, target))) {
          if (!brokenDetails.find(b => b.slug === a.slug && b.target === target)) {
            brokenDetails.push({ slug: a.slug, target });
            monStats.brokenLinks++;
          }
        }
      }
    } catch { /* skip */ }
  }

  if (brokenDetails.length > 0) {
    const preview = brokenDetails.slice(0, 5).map(b => `/${b.slug}/ → /${b.target}/`).join(', ');
    issue(`[${site.domain}] ${monStats.brokenLinks} broken internal links: ${preview}${brokenDetails.length > 5 ? ` +${brokenDetails.length - 5} more` : ''}`);
  }

  // ── e. Orphan articles (nessun link in entrata) ───────────────────────
  const linkedTargets = new Set();
  for (const a of allArticles) {
    const htmlPath = join(siteDir, a.slug, 'index.html');
    if (!existsSync(htmlPath)) continue;
    try {
      const html   = readFileSync(htmlPath, 'utf-8');
      const linkRe = /href="\/([a-z0-9][a-z0-9\-]*)\/?"/gi;
      let m;
      while ((m = linkRe.exec(html)) !== null) linkedTargets.add(m[1].replace(/\/$/, ''));
    } catch { /* skip */ }
  }
  const orphans = allArticles.filter(a => !linkedTargets.has(a.slug));
  if (orphans.length > 3) {
    warn(`[${site.domain}] ${orphans.length} orphan articles (no inbound links) — run relink pass`);
  }

  log(`  [money] Broken links: ${monStats.brokenLinks} | CLS issues: ${monStats.clsIssues} | Ad issues: ${monStats.missingAds}`);
  report.stats[site.domain] = { ...report.stats[site.domain], monetization: monStats };
}

// ── Helper: rigenera sitemap ──────────────────────────────────────────────────

async function regenerateSitemap(site) {
  try {
    const articles = await sql`
      SELECT slug, published_at FROM articles
      WHERE site_id = ${site.id} AND status = 'published'
      ORDER BY published_at DESC
    `;
    generateSitemap(site.domain, articles, { siteName: site.domain });
    fix(`[${site.domain}] Sitemap regenerated (${articles.length} articles)`);
  } catch (e) {
    warn(`sitemap regeneration failed: ${e.message}`);
  }
}

// ── 6. Auto Trigger Regen ─────────────────────────────────────────────────────

/**
 * Esegue automaticamente gli script di rigenerazione per i problemi strutturali rilevati.
 * Chiamato dopo tutti i check: agisce solo se ci sono issue che richiedono regen.
 */
async function autoTriggerRegen(site) {
  const siteDir  = join(WWW_ROOT, site.domain);
  const siteRoot = ROOT;   // ROOT = content-network/ (monorepo root)
  const nodeCmd  = 'node';

  // Funzione helper per eseguire uno script VPS e loggare il risultato
  function runScript(scriptName, extraArgs = []) {
    const scriptPath = join(ROOT, 'packages', 'vps', 'src', scriptName);
    try {
      const result = spawnSync(
        nodeCmd,
        [scriptPath, '--site-id', String(site.id), ...extraArgs],
        { cwd: siteRoot, timeout: 120000, encoding: 'utf-8', env: { ...process.env } }
      );
      if (result.status === 0) {
        fix(`[${site.domain}] auto-regen: ${scriptName} OK`);
        return true;
      } else {
        warn(`[${site.domain}] auto-regen: ${scriptName} failed — ${(result.stderr || '').slice(0, 200)}`);
        return false;
      }
    } catch (e) {
      warn(`[${site.domain}] auto-regen: ${scriptName} exception — ${e.message}`);
      return false;
    }
  }

  let needsHomepage   = false;
  let needsStaticPages = false;
  let needsCSS        = false;

  // Controlla se homepage manca o è troppo piccola
  const homePath = join(siteDir, 'index.html');
  if (!existsSync(homePath) || statSync(homePath).size < 5000) {
    needsHomepage = true;
  }

  // Controlla se pagine editoriali mancano
  const editorialPages = ['about', 'privacy', 'contact'];
  for (const page of editorialPages) {
    if (!existsSync(join(siteDir, page, 'index.html'))) {
      needsStaticPages = true;
      break;
    }
  }

  // Controlla se CSS esiste — supporta nomi versioned (style.v2.css, styles.min.css, ecc.)
  const assetsDir = join(siteDir, 'assets');
  const hasCss = (existsSync(assetsDir) && readdirSync(assetsDir).some(f => f.endsWith('.css')))
    || existsSync(join(siteDir, 'styles.css'))
    || existsSync(join(siteDir, 'style.css'));
  if (!hasCss) {
    needsCSS = true;
  }

  // Esegui regen solo se necessario
  if (needsCSS) {
    log(`  [regen] ${site.domain}: CSS missing → regenerating CSS`);
    runScript('regenerate-css.js');
  }

  if (needsHomepage) {
    log(`  [regen] ${site.domain}: Homepage missing/broken → regenerating homepage`);
    runScript('regenerate-homepage.js');
  }

  if (needsStaticPages) {
    log(`  [regen] ${site.domain}: Static pages missing → regenerating static pages`);
    runScript('regenerate-static-pages.js');
  }

  // Se nessuna regen necessaria → log OK
  if (!needsCSS && !needsHomepage && !needsStaticPages) {
    log(`  [regen] ${site.domain}: No structural regen needed`);
  }
}

// ── 7. Daily Report ───────────────────────────────────────────────────────────

async function sendDailyReport(sites) {
  try {
    const lines = {};
    for (const site of sites) {
      const s = report.stats[site.domain] || {};
      lines[site.domain] = [
        `Published today: ${s.publishedToday ?? '?'}`,
        `Keywords remaining: ${s.keywordsRemaining ?? '?'}`,
        `Queue: ${JSON.stringify(s.queue || {})}`,
        `SEO auto-fixed: ${s.seo?.autoFixed ?? 0}`,
      ].join(' | ');
    }

    await alertReport({
      [`[${AGENT}] Daily Report — ${ALL_MODE ? 'ALL niches' : nicheArg}`]: '',
      ...lines,
      'Issues': report.issues.length ? report.issues.join('\n') : 'None ✅',
      'Warnings': report.warnings.length ? report.warnings.slice(0, 10).join('\n') : 'None ✅',
      'Auto-fixes applied': report.fixes.length ? report.fixes.slice(0, 10).join('\n') : 'None',
    });
  } catch (e) {
    log(`Daily report failed: ${e.message}`);
  }
}

// ── 8. Changelog + GitHub Push ────────────────────────────────────────────────

/**
 * Scrive un'entry nel changelog JSON locale e fa git commit + push.
 * Chiamato alla fine di ogni run solo se ci sono fix o issue.
 * Mantiene le ultime 50 entry (circa 25 giorni di run 2×/giorno).
 */
async function saveChangelogAndPush() {
  if (report.fixes.length === 0 && report.issues.length === 0) {
    log('  [changelog] Nothing to record — skipping');
    return;
  }

  // Leggi storico esistente
  let history = [];
  try {
    if (existsSync(CHANGELOG_PATH)) {
      const raw = readFileSync(CHANGELOG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) history = parsed;
    }
  } catch { history = []; }

  // Nuova entry strutturata
  const entry = {
    date:     new Date().toISOString(),
    niche:    ALL_MODE ? 'ALL' : nicheArg,
    fixes:    report.fixes,
    issues:   report.issues,
    warnings: report.warnings.slice(0, 10),
    stats:    report.stats,
    summary:  `${report.fixes.length} fix${report.fixes.length !== 1 ? 'es' : ''}, ${report.issues.length} issue${report.issues.length !== 1 ? 's' : ''}`,
  };

  history.unshift(entry);
  if (history.length > 50) history = history.slice(0, 50);

  // Scrivi su disco
  try {
    writeFileSync(CHANGELOG_PATH, JSON.stringify(history, null, 2), 'utf-8');
    log(`  [changelog] Saved: ${entry.summary}`);
  } catch (e) {
    warn(`changelog write failed: ${e.message}`);
    return;
  }

  // git add → commit → push
  const commitMsg = `CHIP ${entry.date.slice(0, 10)}: ${entry.summary}`;

  const addResult = spawnSync('git', ['-C', ROOT, 'add', 'packages/vps/src/chip-changelog.json'], {
    timeout: 10000, encoding: 'utf-8',
  });
  if (addResult.status !== 0) {
    warn(`git add failed: ${(addResult.stderr || '').slice(0, 200)}`);
    return;
  }

  const commitResult = spawnSync('git', ['-C', ROOT, 'commit', '-m', commitMsg], {
    timeout: 15000, encoding: 'utf-8',
  });
  if (commitResult.status !== 0) {
    const out = (commitResult.stdout || '') + (commitResult.stderr || '');
    if (out.includes('nothing to commit')) {
      log('  [changelog] git: nothing new to commit');
    } else {
      warn(`git commit failed: ${out.slice(0, 200)}`);
    }
    return;
  }

  const pushResult = spawnSync('git', ['-C', ROOT, 'push', 'origin', 'main'], {
    timeout: 30000, encoding: 'utf-8',
  });
  if (pushResult.status !== 0) {
    warn(`git push failed: ${(pushResult.stderr || '').slice(0, 200)}`);
    return;
  }

  fix(`[CHIP] Changelog committed & pushed to GitHub (${commitMsg})`);
}

// ── Run ───────────────────────────────────────────────────────────────────────

run().catch(err => {
  console.error(`[${AGENT}] Fatal error:`, err);
  process.exit(1);
});
