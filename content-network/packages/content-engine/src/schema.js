/**
 * JSON-LD Schema markup generator
 * Aumenta significativamente la probabilità di rich snippets in SERP
 */

export function buildArticleSchema({ title, description, slug, author, siteName, siteUrl, datePublished }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: `${siteUrl}/${slug}`,
    datePublished,
    dateModified: datePublished,
    author: {
      '@type': 'Person',
      name: author.name,
      jobTitle: author.title,
      description: author.bio,
      url: `${siteUrl}/author/${author.avatar}`
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/${slug}`
    }
  };
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
