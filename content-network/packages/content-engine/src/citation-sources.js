/**
 * Whitelist di URL verificati per le citazioni negli articoli.
 *
 * PROBLEMA: Claude genera URL plausibili ma inventati (es. bls.gov/data/someHash)
 * che portano a 404. Questo file fornisce URL verificati e stabili per le
 * principali organizzazioni autorevoli usate nelle nostre nicchie.
 *
 * STRATEGIA: URL a livello di sezione (non deep link), stabili nel tempo.
 * Claude sceglie da questa lista; il generator scarta URL non in whitelist.
 */

// Mappa: host → URL sicuro della sezione principale
// Usato per rimpiazzare URL inventati con la sezione verificata del sito
export const TRUSTED_CITATION_URLS = {
  // Government — Economics & Labor
  'www.bls.gov':             'https://www.bls.gov/',
  'bls.gov':                 'https://www.bls.gov/',
  'www.census.gov':          'https://www.census.gov/',
  'census.gov':              'https://www.census.gov/',
  'www.federalreserve.gov':  'https://www.federalreserve.gov/releases/',
  'fred.stlouisfed.org':     'https://fred.stlouisfed.org/',
  'www.fdic.gov':            'https://www.fdic.gov/resources/resolutions/bank-failures/',
  'www.irs.gov':             'https://www.irs.gov/newsroom/',
  'www.sec.gov':             'https://www.sec.gov/cgi-bin/browse-edgar',
  'efts.sec.gov':            'https://www.sec.gov/',

  // Government — Health
  'www.cdc.gov':             'https://www.cdc.gov/nchs/',
  'cdc.gov':                 'https://www.cdc.gov/',
  'www.nih.gov':             'https://www.nih.gov/health-information/',
  'nih.gov':                 'https://www.nih.gov/',
  'pubmed.ncbi.nlm.nih.gov': 'https://pubmed.ncbi.nlm.nih.gov/',
  'www.ncbi.nlm.nih.gov':    'https://www.ncbi.nlm.nih.gov/pmc/',
  'www.fda.gov':             'https://www.fda.gov/consumers/',
  'fda.gov':                 'https://www.fda.gov/',
  'www.cms.gov':             'https://www.cms.gov/data-research/',
  'www.medicare.gov':        'https://www.medicare.gov/',

  // Government — Energy & Environment
  'www.eia.gov':             'https://www.eia.gov/electricity/monthly/',
  'eia.gov':                 'https://www.eia.gov/',
  'developer.nrel.gov':      'https://developer.nrel.gov/',
  'www.nrel.gov':            'https://www.nrel.gov/research/',
  'www.dsireusa.org':        'https://www.dsireusa.org/',
  'dsireusa.org':            'https://www.dsireusa.org/',
  'www.energystar.gov':      'https://www.energystar.gov/',

  // Government — Safety & Standards
  'www.nhtsa.gov':           'https://www.nhtsa.gov/vehicle-safety/recalls',
  'nhtsa.gov':               'https://www.nhtsa.gov/',
  'www.osha.gov':            'https://www.osha.gov/laws-regs/',
  'www.fhfa.gov':            'https://www.fhfa.gov/data/',
  'fhfa.gov':                'https://www.fhfa.gov/',
  'www.nist.gov':            'https://www.nist.gov/publications/',
  'nvd.nist.gov':            'https://nvd.nist.gov/',
  'www.cisa.gov':            'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',

  // Professional Organizations
  'www.naic.org':            'https://www.naic.org/cipr_topics.htm',
  'www.acsm.org':            'https://www.acsm.org/read-research/trending-topics-resource-pages/',
  'www.nar.realtor':         'https://www.nar.realtor/research-and-statistics/',
  'www.nabcep.org':          'https://www.nabcep.org/',

  // Academic & Research
  'www.jstor.org':           'https://www.jstor.org/',
  'journals.sagepub.com':    'https://journals.sagepub.com/',
  'www.nejm.org':            'https://www.nejm.org/',

  // Consumer & Legal
  'www.consumerfinance.gov': 'https://www.consumerfinance.gov/data-research/',
  'www.ftc.gov':             'https://www.ftc.gov/tips-advice/business-center/',
  'www.usa.gov':             'https://www.usa.gov/',
  'courtlistener.com':       'https://www.courtlistener.com/',

  // Financial Data
  'www.bankrate.com':        'https://www.bankrate.com/',
  'www.usda.gov':            'https://www.usda.gov/topics/',
  'fdc.nal.usda.gov':        'https://fdc.nal.usda.gov/',
};

/**
 * Restituisce il testo da iniettare nel prompt per guidare Claude
 * nella scelta di URL di citazione verificati.
 */
export function getCitationPromptGuidance() {
  const urlList = Object.values(TRUSTED_CITATION_URLS)
    .filter((v, i, arr) => arr.indexOf(v) === i) // dedup
    .map(u => `    - ${u}`)
    .join('\n');

  return `CITATION URLS — REGOLA CRITICA:
Usa SOLO URL da questa lista verificata. Non inventare path specifici.
Scegli l'URL della sezione più rilevante per la claim citata:
${urlList}
Se nessun URL è appropriato per una claim, ometti la citation per quella claim piuttosto che inventare un URL.`;
}

/**
 * Verifica e sanifica l'array citations generato da Claude.
 * - Scarta citazioni con URL non nella whitelist (sostituisce con base domain)
 * - Scarta citazioni con URL vuoti, malformati o localhost
 * - Mantiene sempre claim + source anche se l'URL viene rimosso
 *
 * @param {Array} citations - Array da Claude: [{claim, source, url}]
 * @returns {Array} Citations sanificate
 */
export function sanitizeCitations(citations) {
  if (!Array.isArray(citations)) return [];

  return citations
    .filter(c => c && c.claim && c.source)
    .map(c => {
      const url = (c.url || '').trim();

      // URL vuoto o mancante → tieni la citation senza link
      if (!url) return { claim: c.claim, source: c.source, url: '' };

      // URL malformato → rimuovi link
      let parsed;
      try {
        parsed = new URL(url);
      } catch {
        return { claim: c.claim, source: c.source, url: '' };
      }

      // Blocca URL non-https, localhost, IP, path inventati su host non in whitelist
      if (parsed.protocol !== 'https:') {
        return { claim: c.claim, source: c.source, url: '' };
      }
      if (parsed.hostname === 'localhost' || /^\d+\.\d+/.test(parsed.hostname)) {
        return { claim: c.claim, source: c.source, url: '' };
      }

      // Se l'host è nella whitelist → usa l'URL verificato della sezione
      const trustedUrl = TRUSTED_CITATION_URLS[parsed.hostname];
      if (trustedUrl) {
        // Usa l'URL esatto dalla whitelist (stabile, verificato)
        // piuttosto che il path inventato da Claude
        return { claim: c.claim, source: c.source, url: trustedUrl };
      }

      // Host non riconosciuto → rimuovi link (mantieni testo)
      return { claim: c.claim, source: c.source, url: '' };
    })
    // Filtra out citazioni senza contenuto utile
    .filter(c => c.claim.length > 10);
}
