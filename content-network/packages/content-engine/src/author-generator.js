/**
 * Author Generator
 * - Genera una bio lunga e dettagliata per ogni autore usando Claude
 * - Scarica un ritratto professionale da Pexels
 * - Produce authors.json da copiare in src/content/ del sito Astro
 */

import Anthropic from '@anthropic-ai/sdk';
import { createWriteStream, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { AUTHOR_PERSONAS } from './prompts.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const PEXELS_KEY = process.env.PEXELS_API_KEY;

/**
 * Genera bio lunga + scarica avatar per tutti gli autori di una nicchia.
 * @param {string} nicheSlug              - Slug della nicchia (es. 'home-improvement-costs')
 * @param {string|object} destDirOrOpts   - Path stringa (Astro) o { destDir, isVps } (VPS)
 * @returns {Array} authors               - Array di oggetti autore completi
 */
export async function generateAuthors(nicheSlug, destDirOrOpts) {
  const isOpts = destDirOrOpts && typeof destDirOrOpts === 'object';
  const destDir = isOpts ? destDirOrOpts.destDir : destDirOrOpts;
  const isVps = isOpts ? destDirOrOpts.isVps : false;
  const persona = AUTHOR_PERSONAS[nicheSlug];
  if (!persona) throw new Error(`No author persona for niche: ${nicheSlug}`);

  console.log(`\n👤 Generating author profile: ${persona.name}`);

  // 1. Genera bio lunga con Claude
  const longBio = await generateLongBio(persona, nicheSlug);
  console.log(`  ✅ Bio generated (${longBio.split(' ').length} words)`);

  // 2. Scarica avatar da Pexels
  let avatarPath = null;
  if (PEXELS_KEY && destDir) {
    // Salva in {destDir}/images/author-{avatar}.jpg
    // Per VPS: destDir = /var/www/domain → /var/www/domain/images/
    // Per Astro: passare il public dir come destDir
    avatarPath = await fetchAuthorPhoto(persona, destDir);
  }

  const author = {
    slug: persona.avatar,
    name: persona.name,
    title: persona.title,
    shortBio: persona.bio,
    longBio,
    avatar: persona.avatar,
    avatarUrl: avatarPath || `/authors/${persona.avatar}.jpg`,
    nicheSlug,
    socialLinks: buildSocialLinks(persona)
  };

  return [author];
}

/**
 * Usa Claude per generare una bio professionale lunga (400-600 parole).
 */
async function generateLongBio(persona, nicheSlug) {
  const genderHint = inferGender(persona.name);
  const prompt = `Write a detailed, professional biography for ${persona.name}, who is a ${persona.title} specializing in ${nicheSlug.replace(/-/g, ' ')}.

Background context: ${persona.bio}

Write the biography in third person. It should be 450-600 words and include:

1. **Origin story** — Where they grew up, what sparked their interest in this field as a young person. Make it personal and specific (a childhood experience, a family member's influence, a defining moment).

2. **Education & credentials** — Their educational path. Be specific with institutions (use plausible but fictional names), degrees, certifications, and any specialized training. Include dates/years.

3. **Career timeline** — Their career progression, the companies or organizations they've worked with (plausible but fictional), key roles, and what they learned at each stage. Include specific projects, achievements, or numbers where natural.

4. **Field expertise** — What makes them specifically qualified to write about ${nicheSlug.replace(/-/g, ' ')}. Concrete experiences, not generic claims.

5. **Personal angle** — A personal story or anecdote that shows ${genderHint.pronoun} direct experience with the subject matter. Something that humanizes them.

6. **Why they write** — What motivated ${genderHint.pronoun} to start sharing knowledge publicly. Their philosophy on helping readers.

7. **Current work** — What ${genderHint.pronoun} is working on now, any ongoing projects, speaking, teaching, or consulting work.

Tone: warm, credible, specific. Avoid corporate-speak. Write as if this were published on a reputable editorial site. Use paragraph breaks naturally. Do NOT use bullet points or headers — it should flow as prose.

Return only the biography text, no introductory sentence like "Here is the biography".`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  return message.content[0].text.trim();
}

/**
 * Scarica un ritratto professionale da Pexels.
 * Cerca "professional portrait [gender]" per ottenere foto credibili.
 */
async function fetchAuthorPhoto(persona, destDir) {
  const gender = inferGender(persona.name);
  // Query specifiche per ritratti frontali con viso — evita busti/torsi/figure intere
  const queries = [
    `${gender.pexelsGender} face portrait close up looking at camera`,
    `${gender.pexelsGender} headshot face only professional neutral background`,
    `${gender.pexelsGender} portrait face forward close up studio`
  ];

  // VPS: destDir = /var/www/domain → salva in /var/www/domain/images/
  const imagesDir = join(destDir, 'images');
  if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true });

  const filename = `author-${persona.avatar}.jpg`;
  const destPath = join(imagesDir, filename);

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&orientation=portrait`,
        { headers: { Authorization: PEXELS_KEY } }
      );

      if (!res.ok) continue;
      const data = await res.json();
      if (!data.photos?.length) continue;

      // Scegli una foto casuale tra le prime 12
      const photo = data.photos[Math.floor(Math.random() * Math.min(data.photos.length, 12))];
      const imgUrl = photo.src.medium; // ~350px — perfetto per avatar circolare

      const imgRes = await fetch(imgUrl);
      if (!imgRes.ok) continue;

      await pipeline(imgRes.body, createWriteStream(destPath));
      console.log(`  Photo saved: /images/${filename} (Pexels #${photo.id})`);
      return `/images/${filename}`;

    } catch (err) {
      console.warn(`  [avatar] Query "${query}" failed: ${err.message}`);
    }
  }

  console.warn(`  [avatar] Could not fetch photo for ${persona.name}`);
  return null;
}

/**
 * Inferisce genere dal nome per rendere pronomi e query Pexels corretti.
 */
function inferGender(name) {
  // Strip titles before extracting first name (Dr., Coach, Prof., Mr., Ms., Mrs.)
  const stripped = name.replace(/^(dr\.|coach|prof\.|mr\.|ms\.|mrs\.)\s+/i, '');
  const firstName = stripped.split(' ')[0].toLowerCase();

  const femaleNames = [
    'sarah', 'emma', 'emily', 'jessica', 'jennifer', 'lisa', 'maria', 'anna',
    'laura', 'linda', 'mary', 'patricia', 'barbara', 'susan', 'karen',
    'amanda', 'rachel', 'nancy', 'dana', 'taylor', 'ashley', 'morgan',
    'stephanie', 'nicole', 'megan', 'elizabeth', 'rebecca', 'kelly',
    'melissa', 'hannah', 'grace', 'victoria', 'olivia', 'sophia', 'angela',
    'sandra', 'dorothy', 'donna', 'carol', 'ruth', 'sharon', 'michelle',
  ];

  const isFemale = femaleNames.includes(firstName);
  return {
    pronoun: isFemale ? 'her' : 'his',
    pexelsGender: isFemale ? 'woman' : 'man'
  };
}

/**
 * Genera link social plausibili basati sul nome.
 */
function buildSocialLinks(persona) {
  const handle = persona.avatar; // es. 'james-crawford'
  return {
    linkedin: `https://linkedin.com/in/${handle}`,
    twitter: `https://twitter.com/${handle.replace('-', '')}`,
  };
}
