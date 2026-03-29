/**
 * JSON-LD Schema markup generator
 * Aumenta significativamente la probabilità di rich snippets in SERP
 */

const MIN_RATINGS = 5; // min votes needed to emit AggregateRating

/**
 * @param {string} [articleType='Article'] — 'Article' or 'NewsArticle'
 * @param {object|null} [rating] — { thumbsUp, thumbsDown } from article_feedback
 */
export function buildArticleSchema({ title, description, slug, author, siteName, siteUrl, datePublished, dateModified, imageSlug, wordCount, articleType = 'Article', rating = null }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': articleType,
    headline: title,
    description,
    url: `${siteUrl}/${slug}`,
    datePublished,
    dateModified: dateModified || datePublished,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    ...(wordCount ? { wordCount } : {}),
    image: imageSlug
      ? { '@type': 'ImageObject', url: `${siteUrl}/images/${imageSlug}.jpg`, width: 1200, height: 630 }
      : undefined,
    author: {
      '@type': 'Person',
      name: author.name,
      jobTitle: author.title,
      description: author.bio,
      url: `${siteUrl}/author/${author.avatar}`,
      image: `${siteUrl}/images/author-${author.avatar}.jpg`
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
        width: 200,
        height: 60
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/${slug}/`
    },
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: siteName,
      url: siteUrl
    }
  };

  // Embed AggregateRating when enough real votes exist
  if (rating) {
    const total = (rating.thumbsUp || 0) + (rating.thumbsDown || 0);
    if (total >= MIN_RATINGS) {
      const ratingValue = parseFloat(((rating.thumbsUp / total) * 4 + 1).toFixed(1));
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue,
        ratingCount: total,
        bestRating: 5,
        worstRating: 1
      };
    }
  }

  return schema;
}

export function buildFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

export function buildHowToSchema({ title, description, steps, totalTime }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    description,
    totalTime,
    step: steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text
    }))
  };
}

export function buildOrganizationSchema({ siteName, siteUrl }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: siteName,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/logo.png`,
      width: 200,
      height: 60
    },
    sameAs: []
  };
}

export function buildBreadcrumbSchema(items, siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`
    }))
  };
}

/**
 * Patch a stored schema_markup array:
 * - Article → NewsArticle for pulse/tribune templates
 * - Inject AggregateRating when enough real votes exist
 * Used at re-render time in rerender-articles.js
 */
export function patchArticleSchemas(schemas, { template, rating }) {
  return schemas.map(s => {
    if (s['@type'] !== 'Article' && s['@type'] !== 'NewsArticle') return s;

    const patched = { ...s };

    if (template === 'pulse' || template === 'tribune') {
      patched['@type'] = 'NewsArticle';
    }

    if (rating) {
      const total = (rating.thumbsUp || 0) + (rating.thumbsDown || 0);
      if (total >= MIN_RATINGS) {
        patched.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: parseFloat(((rating.thumbsUp / total) * 4 + 1).toFixed(1)),
          ratingCount: total,
          bestRating: 5,
          worstRating: 1
        };
      }
    }

    return patched;
  });
}
