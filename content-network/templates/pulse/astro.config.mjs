import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL || 'https://example.com',
  integrations: [sitemap()],
  output: 'static',
  build: {
    format: 'directory' // /article-slug/ → cleaner URLs
  },
  vite: {
    build: {
      cssMinify: true
    }
  }
});
