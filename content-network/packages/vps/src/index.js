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
  const config = `server {
    listen 80;
    listen [::]:80;
    server_name ${domain} www.${domain};
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

    # Clean URLs
    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }

    # Assets cache 1 anno
    location ~* \\.(css|js|png|jpg|jpeg|webp|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Sitemap e robots no cache
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
  const { categories = [], authorSlugs = [], toolSlug = null } = extras;
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    // Homepage
    { loc: `https://${domain}/`, priority: '1.0', changefreq: 'daily', lastmod: today },

    // Static pages
    { loc: `https://${domain}/about/`,             priority: '0.4', changefreq: 'monthly' },
    { loc: `https://${domain}/contact/`,           priority: '0.3', changefreq: 'yearly' },
    { loc: `https://${domain}/editorial-process/`, priority: '0.4', changefreq: 'monthly' },
    { loc: `https://${domain}/advertise/`,         priority: '0.3', changefreq: 'yearly' },
    { loc: `https://${domain}/privacy/`,           priority: '0.2', changefreq: 'yearly' },
    { loc: `https://${domain}/terms/`,             priority: '0.2', changefreq: 'yearly' },
    { loc: `https://${domain}/disclaimer/`,        priority: '0.2', changefreq: 'yearly' },

    // Tool page (1 per sito)
    ...(toolSlug ? [{ loc: `https://${domain}/tools/${toolSlug}/`, priority: '0.7', changefreq: 'monthly', lastmod: today }] : []),

    // Category pages
    ...categories.map(cat => ({
      loc: `https://${domain}/category/${cat.slug}/`,
      priority: '0.6',
      changefreq: 'weekly',
      lastmod: today
    })),

    // Author pages
    ...authorSlugs.map(slug => ({
      loc: `https://${domain}/author/${slug}/`,
      priority: '0.5',
      changefreq: 'monthly'
    })),

    // Articles
    ...articles.map(a => ({
      loc: `https://${domain}/${a.slug}/`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: a.published_at ? new Date(a.published_at).toISOString().split('T')[0] : today
    }))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  writeSiteFile(domain, 'sitemap.xml', xml);
}

export function generateRobotsTxt(domain) {
  writeSiteFile(domain, 'robots.txt', `User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://${domain}/sitemap.xml
`);
}
