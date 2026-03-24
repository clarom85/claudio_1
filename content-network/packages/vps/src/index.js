/**
 * VPS Manager — nginx + filesystem
 * Gestisce creazione siti, virtual hosts, SSL, sitemap
 * Gira direttamente sul VPS (no SSH remoto)
 */
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';
const NGINX_AVAILABLE = '/etc/nginx/sites-available';
const NGINX_ENABLED = '/etc/nginx/sites-enabled';

// ── Directory sito ───────────────────────────────────────────
export function createSiteDirectory(domain) {
  const siteDir = join(WWW_ROOT, domain);
  mkdirSync(join(siteDir, 'assets'), { recursive: true });
  mkdirSync(join(siteDir, 'images'), { recursive: true });
  return siteDir;
}

export function getSiteDir(domain) {
  return join(WWW_ROOT, domain);
}

// ── Scrivi file ──────────────────────────────────────────────
export function writeHtmlFile(domain, slug, html) {
  const dir = join(WWW_ROOT, domain, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
}

export function writeSiteFile(domain, filename, content) {
  writeFileSync(join(WWW_ROOT, domain, filename), content, 'utf-8');
}

// ── Nginx virtual host ───────────────────────────────────────
export function createNginxConfig(domain) {
  const config = `# Redirect www → non-www (301 permanent)
server {
    listen 80;
    listen [::]:80;
    server_name www.${domain};
    return 301 https://${domain}$request_uri;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${domain};
    root /var/www/${domain};
    index index.html;

    # Email subscribe API proxy
    location = /api/subscribe {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type" always;
        if ($request_method = OPTIONS) { return 204; }
    }

    # HTML pages — cache at Cloudflare edge for 1 hour, revalidate after
    location / {
        try_files $uri $uri/ $uri/index.html =404;
        add_header Cache-Control "public, max-age=3600, stale-while-revalidate=86400";
    }

    # Images — serve WebP to supporting browsers (map $webp_suffix in /etc/nginx/conf.d/webp.conf)
    location ~* ^(/images/.+)\\.jpe?g$ {
        set $img_base $1;
        add_header Vary Accept;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files $img_base$webp_suffix $uri =404;
    }

    # CSS/JS — 1 day (can change after deploys, do NOT mark immutable)
    location ~* \\.(css|js)$ {
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
        access_log off;
    }

    # Images/fonts — immutable 1 year (never change for same slug)
    location ~* \\.(png|webp|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Sitemap, robots, ads.txt, feed — no cache
    location ~* \\.(xml|txt)$ {
        expires 1d;
        add_header Cache-Control "public";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/html text/css application/javascript application/json;

    error_page 404 /404.html;
    access_log /var/log/nginx/${domain}.access.log;
    error_log /var/log/nginx/${domain}.error.log;
}`;

  writeFileSync(join(NGINX_AVAILABLE, domain), config, 'utf-8');

  // Enable
  const enabledPath = join(NGINX_ENABLED, domain);
  if (!existsSync(enabledPath)) {
    execSync(`ln -s ${join(NGINX_AVAILABLE, domain)} ${enabledPath}`);
  }
}

export function reloadNginx() {
  // Ensure WebP map and conf.d include exist (idempotent — safe to run on every spawn)
  try {
    const webpConf = '/etc/nginx/conf.d/webp.conf';
    if (!existsSync(webpConf)) {
      writeFileSync(webpConf,
        '# Serve WebP images automatically to supporting browsers\n' +
        'map $http_accept $webp_suffix {\n' +
        '    default   "";\n' +
        '    "~*webp"  ".webp";\n' +
        '}\n'
      );
    }
    // Add conf.d include to nginx.conf if not already present
    const nginxConf = readFileSync('/etc/nginx/nginx.conf', 'utf-8');
    if (!nginxConf.includes('conf.d')) {
      writeFileSync('/etc/nginx/nginx.conf',
        nginxConf.replace(
          'include /etc/nginx/sites-enabled/*;',
          'include /etc/nginx/conf.d/*.conf;\n    include /etc/nginx/sites-enabled/*;'
        )
      );
    }
  } catch { /* non-VPS environment — skip */ }

  try {
    execSync('nginx -t 2>&1', { stdio: 'pipe' });
    execSync('nginx -s reload');
    return true;
  } catch (err) {
    console.error('Nginx reload failed:', err.message);
    return false;
  }
}

// ── SSL con Certbot ──────────────────────────────────────────
export function enableSSL(domain, email) {
  try {
    execSync(
      `certbot --nginx -d ${domain} -d www.${domain} --non-interactive --agree-tos -m ${email} --redirect`,
      { stdio: 'pipe', timeout: 60000 }
    );
    console.log(`  ✅ SSL enabled for ${domain}`);
    return true;
  } catch (err) {
    console.warn(`  ⚠️  SSL failed for ${domain}: ${err.message}`);
    return false;
  }
}

// ── Sitemap ──────────────────────────────────────────────────
/**
 * @param {string} domain
 * @param {object[]} articles
 * @param {object} extras  - { categories, authorSlugs, toolSlug }
 */
export function generateSitemap(domain, articles, extras = {}) {
  const { categories = [], authorSlugs = [], toolSlug = null, siteName = domain } = extras;
  const today = new Date().toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const staticEntries = [
    { loc: `https://${domain}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
    { loc: `https://${domain}/about/`,             priority: '0.4', changefreq: 'monthly' },
    { loc: `https://${domain}/contact/`,           priority: '0.3', changefreq: 'yearly' },
    { loc: `https://${domain}/editorial-process/`, priority: '0.4', changefreq: 'monthly' },
    { loc: `https://${domain}/advertise/`,         priority: '0.3', changefreq: 'yearly' },
    { loc: `https://${domain}/privacy/`,           priority: '0.2', changefreq: 'yearly' },
    { loc: `https://${domain}/terms/`,             priority: '0.2', changefreq: 'yearly' },
    { loc: `https://${domain}/disclaimer/`,        priority: '0.2', changefreq: 'yearly' },
    ...(toolSlug ? [{ loc: `https://${domain}/tools/${toolSlug}/`, priority: '0.7', changefreq: 'monthly', lastmod: today }] : []),
    ...categories.map(cat => ({ loc: `https://${domain}/category/${cat.slug}/`, priority: '0.6', changefreq: 'weekly', lastmod: today })),
    ...authorSlugs.map(slug => ({ loc: `https://${domain}/author/${slug}/`, priority: '0.5', changefreq: 'monthly' })),
  ];

  function buildUrlEntry(a) {
    const isCategory = a.slug.startsWith('category/');
    const isTag = a.slug.startsWith('tag/');
    const priority = isCategory ? '0.6' : isTag ? '0.4' : '0.8';
    const lastmod = a.published_at ? new Date(a.published_at).toISOString().split('T')[0] : today;
    const isRecent = a.published_at && new Date(a.published_at) > twoDaysAgo;

    let inner = `    <loc>https://${domain}/${a.slug}/</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
    <lastmod>${lastmod}</lastmod>`;

    // news:news — only for real articles published in the last 2 days
    if (!isCategory && !isTag && isRecent && a.title) {
      inner += `
    <news:news>
      <news:publication>
        <news:name>${escXml(siteName)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(a.published_at).toISOString()}</news:publication_date>
      <news:title>${escXml(a.title)}</news:title>
    </news:news>`;
    }

    // image:image — for articles with an image
    if (!isCategory && !isTag && a.image) {
      const imageUrl = a.image.startsWith('http') ? a.image : `https://${domain}${a.image}`;
      inner += `
    <image:image>
      <image:loc>${escXml(imageUrl)}</image:loc>
      ${a.title ? `<image:title>${escXml(a.title)}</image:title>` : ''}
    </image:image>`;
    }

    return `  <url>\n${inner}\n  </url>`;
  }

  const staticXml = staticEntries.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticXml}
${articles.map(buildUrlEntry).join('\n')}
</urlset>`;

  writeSiteFile(domain, 'sitemap.xml', xml);
}

export function generateRssFeed(domain, articles, { siteName = domain } = {}) {
  const siteUrl = `https://${domain}`;
  const items = articles
    .filter(a => !a.slug?.startsWith('category/') && !a.slug?.startsWith('tag/'))
    .slice(0, 50)
    .map(a => {
      const pubDate = a.published_at ? new Date(a.published_at).toUTCString() : new Date().toUTCString();
      return `    <item>
      <title>${escXml(a.title || '')}</title>
      <link>${siteUrl}/${a.slug}/</link>
      <description>${escXml(a.meta_description || a.excerpt || '')}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${siteUrl}/${a.slug}/</guid>
      ${a.category ? `<category>${escXml(a.category)}</category>` : ''}
    </item>`;
    }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escXml(siteName)}</title>
    <link>${siteUrl}/</link>
    <description>Expert guides, how-to articles, and practical advice from ${escXml(siteName)}.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  writeSiteFile(domain, 'feed.xml', xml);
}

export async function pingSitemap(domain) {
  const sitemapUrl = encodeURIComponent(`https://${domain}/sitemap.xml`);
  try {
    await Promise.all([
      fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`),
      fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`)
    ]);
    console.log(`  Pinged Google + Bing: ${domain}`);
  } catch (_) { /* non-blocking */ }
}

function escXml(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function generateRobotsTxt(domain) {
  writeSiteFile(domain, 'robots.txt', `User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://${domain}/sitemap.xml
`);
}

/**
 * ads.txt — IAB standard for authorized digital sellers.
 * Senza questo file i DSP pagano meno (o non comprano) l'inventory AdSense.
 * f08c47fec0942fa0 è il TAG-ID pubblico di Google (non un segreto).
 */
export function generateAdsTxt(domain, adsensePublisherId, ezoicSiteId) {
  const lines = [];
  if (adsensePublisherId) {
    lines.push(`google.com, ${adsensePublisherId}, DIRECT, f08c47fec0942fa0`);
  }
  if (ezoicSiteId) {
    // Ezoic is a Google Certified Publishing Partner — resells inventory from multiple networks
    lines.push(`ezoic.com, ${ezoicSiteId}, DIRECT`);
    lines.push(`ezoic.com, ${ezoicSiteId}, RESELLER`);
  }
  if (!lines.length) return;
  writeSiteFile(domain, 'ads.txt', lines.join('\n') + '\n');
}
