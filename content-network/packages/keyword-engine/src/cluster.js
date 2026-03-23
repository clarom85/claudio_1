/**
 * Content Clustering — raggruppa keywords in topic cluster
 *
 * Ogni cluster ha:
 * - 1 articolo PILLAR (broad, genera la pagina principale del topic)
 * - N articoli SATELLITE (specifici, linkano al pillar)
 *
 * Strategia:
 * 1. Raggruppa per categoria (usando rules di categories.js)
 * 2. Dentro ogni categoria, sub-cluster per radice del topic
 * 3. Pillar = keyword più corta/generica del cluster
 *
 * Risultato: topical authority — Google premia siti con profondità su un argomento
 */

import { classifyArticle } from '@content-network/content-engine/src/categories.js';

const US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
const GEO_RE = new RegExp(`\\b(${US_STATES.join('|')})\\b`, 'i');

function geoSlug(keyword, baseSlug) {
  const match = keyword.match(GEO_RE);
  if (!match) return null;
  return `${baseSlug}-${match[1].toLowerCase().replace(/\s+/g, '-')}`;
}

// Qualificatori che rendono una keyword "satellite" (troppo specifica per essere pillar)
const SATELLITE_SIGNALS = [
  /^how (much|to|long|often|do|does|can|should)/i,
  /^what (is|are|does|causes)/i,
  /^why (is|does|are|do)/i,
  /^when (to|should|do|does)/i,
  /^best\s/i,
  /\bfor\s+(small|large|old|new|cheap|budget)\b/i,
  /\b(diy|yourself|without)\b/i,
  /\b(vs\.?|versus|compared)\b/i,
  /\b(average|typical|standard|normal)\b/i,
  /\d+/,   // contiene numeri (prezzi, misure, anni)
  /\b(signs|symptoms|causes|effects|tips|tricks|ideas|examples|types|list)\b/i,
];

/**
 * Assegna cluster e ruolo (pillar/satellite) a ogni keyword.
 *
 * @param {string[]} keywords     — array di keyword strings
 * @param {string}   nicheSlug    — slug della nicchia
 * @param {string[]} seedKeywords — seed keywords (queste diventano pillars)
 * @returns {Array<{ keyword, clusterSlug, isPillar }>}
 */
export function clusterKeywords(keywords, nicheSlug, seedKeywords = []) {
  const seedSet = new Set(seedKeywords.map(s => s.toLowerCase().trim()));

  // Step 1: Classifica ogni keyword nella sua categoria
  // Le keyword geo ottengono un cluster dedicato (topic-stato) per evitare conflitti col limite per cluster.
  const classified = keywords.map(kw => {
    const cat = classifyArticle(nicheSlug, kw, kw);
    const geo = geoSlug(kw, cat.slug);
    return { keyword: kw, clusterSlug: geo || cat.slug };
  });

  // Step 2: Per ogni cluster, trova il pillar
  const clusterMap = new Map();
  for (const item of classified) {
    if (!clusterMap.has(item.clusterSlug)) {
      clusterMap.set(item.clusterSlug, []);
    }
    clusterMap.get(item.clusterSlug).push(item.keyword);
  }

  // Step 3: Assegna isPillar
  const pillarMap = new Map(); // clusterSlug → pillar keyword

  for (const [clusterSlug, kwList] of clusterMap) {
    // Priorità pillar:
    // 1. Corrisponde a un seed keyword
    // 2. Più corto in parole e non ha signal satellite
    // 3. Semplicemente il più corto

    const seedMatch = kwList.find(kw => seedSet.has(kw.toLowerCase()));

    if (seedMatch) {
      pillarMap.set(clusterSlug, seedMatch);
      continue;
    }

    // Filtra quelli senza signal satellite
    const broadKeywords = kwList.filter(kw => !isSatellite(kw));

    // Il più corto tra quelli broad (meno parole = più generico)
    const candidates = broadKeywords.length ? broadKeywords : kwList;
    const pillar = candidates.reduce((best, kw) =>
      kw.split(/\s+/).length < best.split(/\s+/).length ? kw : best
    );

    pillarMap.set(clusterSlug, pillar);
  }

  // Step 4: Combina risultati
  return classified.map(item => ({
    keyword: item.keyword,
    clusterSlug: item.clusterSlug,
    isPillar: pillarMap.get(item.clusterSlug) === item.keyword,
  }));
}

function isSatellite(keyword) {
  return SATELLITE_SIGNALS.some(re => re.test(keyword));
}

/**
 * Log diagnostico del clustering
 */
export function logClusterStats(clustered) {
  const byCluster = {};
  for (const item of clustered) {
    if (!byCluster[item.clusterSlug]) byCluster[item.clusterSlug] = { pillar: null, count: 0 };
    if (item.isPillar) byCluster[item.clusterSlug].pillar = item.keyword;
    byCluster[item.clusterSlug].count++;
  }

  console.log('\n📊 Content clusters:');
  for (const [slug, data] of Object.entries(byCluster)) {
    console.log(`  [${slug}] ${data.count} articles — pillar: "${data.pillar}"`);
  }
}
