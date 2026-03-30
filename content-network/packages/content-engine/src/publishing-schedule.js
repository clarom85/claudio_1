/**
 * Publishing Schedule — cadenza articoli adattiva basata sull'età del sito
 *
 * Logica anti-penalty Google:
 * - Siti nuovi pubblicano poco (Google sandbox), siti maturi pubblicano di più
 * - Orari di pubblicazione cambiano ogni giorno (nessun pattern fisso riconoscibile)
 * - Gap variabili tra articoli: da 20 min a 3 ore (comportamento umano)
 * - Giorni STOP per sito: randomizzati e diversificati (non tutti i siti fermi lo stesso giorno)
 * - Dead day probability: più alta nella fase di crescita, si riduce per siti maturi
 */

// EST = UTC-5 (non gestiamo DST — margine sufficiente)
const EST_OFFSET_MS = 5 * 60 * 60 * 1000;

// Finestra di pubblicazione (ora EST) — orari organici, nessuna pubblicazione di notte
const PUBLISH_START_MIN = 8 * 60;   // 08:00 EST
const PUBLISH_END_MIN   = 20 * 60;  // 20:00 EST (no pubblicazioni dopo le 8pm)
const WINDOW_MIN = PUBLISH_END_MIN - PUBLISH_START_MIN; // 720 min

// Gap minimo e massimo tra articoli consecutivi (minuti)
const GAP_MIN = 25;   // minimo 25 min tra articoli
const GAP_MAX = 180;

/**
 * Fasce di rampa per età sito.
 * deadDayProb: probabilità che oggi sia un giorno STOP per questo sito.
 * I siti maturi hanno deadDayProb più bassa perché pubblicano regolarmente.
 */
const RAMP = [
  { maxDays:  14, minPerDay:  3, maxPerDay:  5, deadDayProb: 0.00, label: 'Warm-up (week 1-2)' },
  { maxDays:  30, minPerDay:  5, maxPerDay:  8, deadDayProb: 0.15, label: 'Early growth (month 1)' },
  { maxDays:  60, minPerDay:  7, maxPerDay: 11, deadDayProb: 0.25, label: 'Growth (month 2)' },
  { maxDays:  90, minPerDay:  9, maxPerDay: 13, deadDayProb: 0.20, label: 'Established (month 3)' },
  { maxDays: 180, minPerDay: 11, maxPerDay: 14, deadDayProb: 0.12, label: 'Authority (month 4-6)' },
  { maxDays: Infinity, minPerDay: 12, maxPerDay: 15, deadDayProb: 0.08, label: 'Mature (6m+)' },
];

// ─── Seeded PRNG (Mulberry32) ─────────────────────────────────────────────────
// Deterministico: stesso siteId + stessa data → sempre stesso risultato.
// Garantisce che diversi siti abbiano giorni STOP diversificati.

function seededRand(seed) {
  let t = (seed + 0x6D2B79F5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function dayNumber(date = new Date()) {
  return Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
}

// ─── Dead day (giorno STOP) ───────────────────────────────────────────────────

/**
 * Decide se oggi è un giorno STOP per questo sito.
 * Usa un PRNG deterministico: stesso siteId + stessa data → stesso risultato,
 * ma siti diversi hanno giorni STOP diversi (diversificati).
 *
 * @param {number} siteId
 * @param {Date|string} siteCreatedAt
 * @param {Date} [date]
 * @returns {boolean}
 */
export function isDeadDay(siteId, siteCreatedAt, date = new Date()) {
  const ageDays = Math.floor((date.getTime() - new Date(siteCreatedAt).getTime()) / (1000 * 60 * 60 * 24));
  const phase = RAMP.find(r => ageDays <= r.maxDays) || RAMP[RAMP.length - 1];

  // Seed unico per sito + giorno: siti diversi → giorni STOP diversi
  const seed = (siteId * 73856093) ^ (dayNumber(date) * 19349663);
  return seededRand(seed) < phase.deadDayProb;
}

// ─── Daily article limit ──────────────────────────────────────────────────────

/**
 * Calcola quanti articoli pubblicare oggi per questo sito.
 * Il numero varia ogni giorno all'interno del range della fase.
 *
 * @param {Date|string} siteCreatedAt
 * @param {Date} [date]
 * @returns {{ count: number, ageDays: number, label: string }}
 */
// Moltiplicatore per giorno della settimana (0=Dom … 6=Sab).
// Martedì/Mercoledì sono i picchi editoriali tipici; weekend più basso.
const DOW_MULTIPLIER = [0.60, 0.95, 1.10, 1.10, 1.00, 0.85, 0.65];

// Variazione settimana-su-settimana: settimane diverse hanno "ritmo" diverso.
// Usa un seed deterministico basato sul numero di settimana ISO → stesso valore
// per tutta la settimana, ma diverso da una settimana all'altra.
function weeklyVariation(date) {
  const weekNum = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
  const r = seededRand(weekNum * 2654435761);
  // Range: da -10% a +15% del volume base
  return 0.90 + r * 0.25;
}

export function getDailyArticleLimit(siteCreatedAt, date = new Date()) {
  const ageDays = Math.floor((date.getTime() - new Date(siteCreatedAt).getTime()) / (1000 * 60 * 60 * 24));
  const phase = RAMP.find(r => ageDays <= r.maxDays) || RAMP[RAMP.length - 1];

  // Variazione casuale nel range — diversa ogni giorno
  const range = phase.maxPerDay - phase.minPerDay;
  const base = phase.minPerDay + Math.floor(Math.random() * (range + 1));

  // Applica moltiplicatore giorno-settimana + variazione settimanale
  const dow = date.getDay(); // 0=Dom … 6=Sab
  const adjusted = Math.round(base * DOW_MULTIPLIER[dow] * weeklyVariation(date));

  // Clamp: mai sotto 1 (se non è dead day) e mai sopra il max di fase
  const count = Math.max(1, Math.min(adjusted, phase.maxPerDay));

  return { count, ageDays, label: phase.label, dow };
}

// ─── Time slots ───────────────────────────────────────────────────────────────

/**
 * Genera N timestamp di pubblicazione organici per oggi.
 * Gli orari cambiano ogni giorno: gap variabili (20 min – 3h), nessun pattern fisso.
 *
 * @param {number} index   — indice articolo (0-based)
 * @param {number} total   — totale articoli da schedulare
 * @param {Date}   [baseDate]
 * @returns {Date}
 */
export function getPublishTime(index, total, baseDate = new Date()) {
  // Calcola la data base in EST (ignora l'ora, partiamo dall'inizio finestra)
  const nowEst = new Date(baseDate.getTime() - EST_OFFSET_MS);
  const currentMinEst = nowEst.getUTCHours() * 60 + nowEst.getUTCMinutes();

  // Determina la data EST da cui partiamo
  let baseDateEst = new Date(nowEst);
  let startMin; // minuto EST da cui iniziare la distribuzione

  if (currentMinEst >= PUBLISH_END_MIN - GAP_MIN) {
    // Troppo tardi oggi → schedula da domani mattina
    baseDateEst.setUTCDate(baseDateEst.getUTCDate() + 1);
    baseDateEst.setUTCHours(0, 0, 0, 0);
    startMin = PUBLISH_START_MIN;
  } else if (currentMinEst < PUBLISH_START_MIN) {
    startMin = PUBLISH_START_MIN;
  } else {
    // Arrotonda ai prossimi 5 minuti
    startMin = Math.ceil(currentMinEst / 5) * 5 + 5;
  }

  // Genera tutti gli slot per questo batch in modo coerente
  // usando Math.random() con un seed virtuale basato sull'inizio del batch
  const slots = generateOrganicSlots(total, startMin, PUBLISH_END_MIN);
  const slotMin = slots[Math.min(index, slots.length - 1)];

  // Costruisci il Date finale in UTC
  const result = new Date(baseDateEst);
  result.setUTCHours(Math.floor(slotMin / 60), slotMin % 60, 0, 0);
  return new Date(result.getTime() + EST_OFFSET_MS);
}

/**
 * Genera N slot di minuti distribuiti organicamente nella finestra [startMin, endMin].
 * Gap variabili: tra GAP_MIN (20) e GAP_MAX (180) minuti.
 * Chiamato una sola volta per batch → tutti gli articoli usano la stessa lista.
 *
 * Pattern organico: a volte due articoli vicini, poi una pausa lunga — come un editor umano.
 */
function generateOrganicSlots(count, startMin, endMin) {
  if (count <= 0) return [];
  if (count === 1) {
    const mid = startMin + Math.floor(Math.random() * (endMin - startMin));
    return [mid];
  }

  const available = endMin - startMin - (count * GAP_MIN);
  const slots = [];
  let cursor = startMin;

  for (let i = 0; i < count; i++) {
    const remaining = count - i - 1;
    const maxGap = remaining > 0
      ? Math.min(GAP_MAX, Math.floor((endMin - cursor - remaining * GAP_MIN) / 1))
      : GAP_MAX;
    const gap = GAP_MIN + Math.floor(Math.random() * Math.max(1, maxGap - GAP_MIN + 1));
    cursor += gap;
    if (cursor >= endMin) cursor = endMin - (remaining * GAP_MIN) - 1;
    slots.push(Math.min(cursor, endMin - 1));
  }

  return slots;
}

// ─── Publishing window check ─────────────────────────────────────────────────

/**
 * Restituisce true se l'orario corrente è dentro la finestra di pubblicazione EST.
 * Usato come guard assoluto in publishDueArticles() — indipendente da scheduled_for.
 *
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isWithinPublishingWindow(now = new Date()) {
  const estTotal = ((now.getUTCHours() - 5 + 24) % 24) * 60 + now.getUTCMinutes();
  return estTotal >= PUBLISH_START_MIN && estTotal < PUBLISH_END_MIN;
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────

export function logScheduleInfo(siteCreatedAt, siteId = 0) {
  const { count, ageDays, label } = getDailyArticleLimit(siteCreatedAt);
  const dead = isDeadDay(siteId, siteCreatedAt);
  console.log(`  Schedule: ${ageDays}d old → ${label}${dead ? ' [DEAD DAY — skip]' : ''}`);
  console.log(`  Today's target: ${count} articles | window: 08:00–20:00 EST | gaps: 25min–3h`);
  return count;
}
