/**
 * Internal link injector — second pass dopo la generazione di tutti gli articoli.
 * Per ogni articolo, cerca nel testo i titoli/keyword degli altri articoli
 * e aggiunge un link interno la prima volta che la frase appare.
 *
 * Regole:
 * - Max 3 link interni per articolo
 * - Non linkare l'articolo a se stesso
 * - Solo la prima occorrenza di ogni frase viene linkata
 * - Non modifica testo dentro tag HTML esistenti
 */

/**
 * @param {Array<{slug: string, title: string, content: string, tags?: string[]}>} articles
 * @returns {Array} — stessi articoli con `.content` aggiornato
 */
export function injectInternalLinks(articles) {
  if (!articles?.length) return articles;

  // Costruisci indice: per ogni articolo, i suoi anchor text candidati
  const linkTargets = articles.map(a => ({
    slug: a.slug,
    phrases: buildPhrases(a.title, a.tags)
  }));

  return articles.map(article => {
    let content = article.content;
    let linksAdded = 0;
    const usedSlugs = new Set();

    // Shuffla targets per variare quali articoli vengono linkati
    const shuffled = [...linkTargets].sort(() => Math.random() - 0.5);

    for (const target of shuffled) {
      if (linksAdded >= 3) break;
      if (target.slug === article.slug) continue; // no self-link
      if (usedSlugs.has(target.slug)) continue;

      for (const phrase of target.phrases) {
        if (phrase.length < 15) continue; // frasi troppo corte → falsi positivi

        // Cerca la frase nel testo visibile (non dentro attributi HTML)
        const result = injectLink(content, phrase, target.slug);
        if (result.injected) {
          content = result.content;
          usedSlugs.add(target.slug);
          linksAdded++;
          break; // una frase per target
        }
      }
    }

    return { ...article, content };
  });
}

/**
 * Costruisce le frasi anchor candidate da titolo e tags.
 * Ordinate dalla più lunga alla più corta (match più precisi prima).
 */
function buildPhrases(title, tags = []) {
  const phrases = [title];

  // Aggiungi sottostringhe significative del titolo (ultime N parole)
  const words = title.split(/\s+/);
  if (words.length > 4) {
    phrases.push(words.slice(1).join(' ')); // titolo senza prima parola
    phrases.push(words.slice(0, -1).join(' ')); // titolo senza ultima parola
  }

  // Aggiungi tags come anchor text
  for (const tag of tags) {
    if (tag.length >= 15) phrases.push(tag);
  }

  return phrases.sort((a, b) => b.length - a.length);
}

/**
 * Inietta un link interno nella prima occorrenza di `phrase` in `content`,
 * evitando occorrenze già dentro tag HTML o dentro <a> esistenti.
 * Idempotente: eseguire più volte non duplica i link.
 */
function injectLink(content, phrase, slug) {
  const parts = content.split(/(<[^>]+>)/);
  let injected = false;
  let insideAnchor = false;

  const result = parts.map(part => {
    if (injected) return part;

    if (part.startsWith('<')) {
      // Traccia apertura/chiusura tag <a> per non linkare dentro anchor esistenti
      if (/^<a[\s>]/i.test(part))  insideAnchor = true;
      if (/^<\/a>/i.test(part))    insideAnchor = false;
      return part;
    }

    // Testo dentro un <a> esistente → skip (idempotenza)
    if (insideAnchor) return part;

    const regex = new RegExp(`(${escapeRegex(phrase)})`, 'i');
    if (regex.test(part)) {
      injected = true;
      return part.replace(regex, `<a href="/${slug}" style="color:inherit;text-decoration:underline;text-underline-offset:2px;">$1</a>`);
    }
    return part;
  });

  return { content: result.join(''), injected };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
