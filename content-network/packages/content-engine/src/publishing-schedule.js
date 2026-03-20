/**
 * Publishing Schedule — cadenza articoli basata sull'età del sito
 *
 * Logica anti-penalty Google:
 * - Siti nuovi pubblicano poco e lentamente (crawl budget basso)
 * - La rampa è graduale per sembrare crescita organica
 * - Pubblicazione solo in orari umani (7am-10pm EST)
 * - Jitter casuale ±12 minuti su ogni slot (non meccanico)
 * - Nessuna pubblicazione nelle ore notturne
 */

// EST = UTC-5 (non gestiamo DST — margine sufficiente)
const EST_OFFSET_MS = 5 * 60 * 60 * 1000;

// Finestra di pubblicazione in ora EST
const PUBLISH_START_HOUR = 7;   // 7:00am EST
const PUBLISH_END_HOUR   = 22;  // 10:00pm EST
const PUBLISH_WINDOW_HOURS = PUBLISH_END_HOUR - PUBLISH_START_HOUR; // 15 ore

/**
 * Fasce di rampa basate sui giorni di vita del sito.
 * Ogni fascia ha un range [min, max] — si usa il mid ± 20% random.
 */
const RAMP = [
  { maxDays:  14, minPerDay:  3, maxPerDay:  5, label: 'Warm-up (week 1-2)' },
  { maxDays:  30, minPerDay:  6, maxPerDay: 10, label: 'Early growth (month 1)' },
  { maxDays:  60, minPerDay: 10, maxPerDay: 16, label: 'Growth (month 2)' },
  { maxDays:  90, minPerDay: 16, maxPerDay: 22, label: 'Established (month 3)' },
  { maxDays: 180, minPerDay: 20, maxPerDay: 28, label: 'Authority (month 4-6)' },
  { maxDays: Infinity, minPerDay: 25, maxPerDay: 35, label: 'Mature (6m+)' },
];

/**
 * Calcola quanti articoli pubblicare oggi per questo sito.
 * @param {Date|string} siteCreatedAt — data creazione sito
 * @returns {{ count: number, label: string }}
 */
export function getDailyArticleLimit(siteCreatedAt) {
  const created = new Date(siteCreatedAt);
  const ageDays = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));

  const phase = RAMP.find(r => ageDays <= r.maxDays) || RAMP[RAMP.length - 1];

  // Variazione casuale nel range — ogni giorno un numero leggermente diverso
  const range = phase.maxPerDay - phase.minPerDay;
  const count = phase.minPerDay + Math.floor(Math.random() * (range + 1));

  return { count, ageDays, label: phase.label };
}

/**
 * Schedula N articoli distribuiti nella finestra 7am-10pm EST di oggi.
 * Ogni slot ha un jitter casuale ±12 minuti.
 *
 * @param {number} index         — indice articolo (0-based)
 * @param {number} total         — totale articoli da schedulare
 * @param {Date}   [baseDate]    — data di partenza (default: now)
 * @returns {Date} — timestamp pubblicazione
 */
export function getPublishTime(index, total, baseDate = new Date()) {
  // Converti ora corrente in EST
  const nowEst = new Date(baseDate.getTime() - EST_OFFSET_MS);
  const currentHourEst = nowEst.getUTCHours();

  // Se siamo già in fascia serale, schedula per domani mattina
  let startEst;
  if (currentHourEst >= PUBLISH_END_HOUR - 1) {
    // Domani alle 7am EST
    const tomorrow = new Date(nowEst);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(PUBLISH_START_HOUR, 0, 0, 0);
    startEst = tomorrow;
  } else if (currentHourEst < PUBLISH_START_HOUR) {
    // Oggi alle 7am EST
    const today = new Date(nowEst);
    today.setUTCHours(PUBLISH_START_HOUR, 0, 0, 0);
    startEst = today;
  } else {
    // Ora corrente arrotondata ai 10 minuti successivi
    startEst = new Date(nowEst);
    startEst.setUTCMinutes(Math.ceil(startEst.getUTCMinutes() / 10) * 10, 0, 0);
  }

  // Intervallo tra articoli in minuti, distribuito nella finestra
  const windowMinutes = PUBLISH_WINDOW_HOURS * 60;
  const intervalMinutes = total > 1 ? windowMinutes / (total - 1) : windowMinutes;

  // Offset per questo articolo
  const offsetMinutes = index * intervalMinutes;

  // Jitter casuale ±12 minuti (non pubblicare esattamente all'ora)
  const jitterMinutes = (Math.random() * 24) - 12;

  const publishEst = new Date(startEst.getTime() + (offsetMinutes + jitterMinutes) * 60 * 1000);

  // Clamp: non uscire dalla finestra 7am-10pm EST
  publishEst.setUTCHours(
    Math.min(Math.max(publishEst.getUTCHours(), PUBLISH_START_HOUR), PUBLISH_END_HOUR - 1)
  );

  // Riconverti in UTC
  return new Date(publishEst.getTime() + EST_OFFSET_MS);
}

/**
 * Log diagnostico — utile per debug
 */
export function logScheduleInfo(siteCreatedAt) {
  const { count, ageDays, label } = getDailyArticleLimit(siteCreatedAt);
  console.log(`  📅 Schedule: site is ${ageDays} days old → ${label}`);
  console.log(`  📰 Today's limit: ${count} articles/day`);
  console.log(`  🕐 Window: ${PUBLISH_START_HOUR}am–${PUBLISH_END_HOUR - 12}pm EST (with ±12min jitter)`);
  return count;
}
