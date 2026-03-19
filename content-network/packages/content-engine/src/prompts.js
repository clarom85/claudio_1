/**
 * Prompt templates per generazione articoli SEO
 * Progettati per passare Helpful Content Update di Google
 * E-E-A-T compliant: Experience, Expertise, Authority, Trust
 */

export function buildArticlePrompt(keyword, niche, options = {}) {
  const { targetWordCount = 1200, includeSchema = true } = options;

  return `You are an expert content writer for a ${niche.name} publication. Write a comprehensive, genuinely helpful article about: "${keyword}"

REQUIREMENTS:
- Word count: ${targetWordCount}-${targetWordCount + 300} words
- Tone: authoritative but accessible, like a knowledgeable friend explaining
- Structure: answer the query directly in the first paragraph, then expand
- Include real, specific, actionable information (not generic fluff)
- Write as if you have direct experience with this topic

OUTPUT FORMAT (return valid JSON only, no markdown wrapper):
{
  "title": "compelling H1 title (50-65 chars, includes keyword naturally)",
  "metaDescription": "compelling meta description (150-160 chars, includes keyword, has CTA)",
  "h2s": ["section 1 title", "section 2 title", ...],
  "intro": "2-3 sentence intro paragraph that directly answers the query",
  "sections": [
    {
      "h2": "section title",
      "content": "2-4 paragraphs of substantive content",
      "hasList": true/false,
      "listItems": ["item 1", "item 2", ...] // if hasList true
    }
  ],
  "faq": [
    { "question": "related question?", "answer": "concise answer (2-3 sentences)" }
  ],
  "conclusion": "1-2 paragraph conclusion with actionable takeaway",
  "authorNote": "1 sentence from the author's experience perspective (use 'I' voice)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "schemaType": "Article" // or "HowTo", "FAQPage" based on content
}

CRITICAL RULES:
- NEVER use filler phrases like "In conclusion", "It's important to note", "As we've seen"
- NEVER keyword stuff — use keyword naturally max 3-4 times
- Include specific numbers, costs, timeframes where relevant
- FAQ section must have 4-6 questions people actually search
- Each section must add unique value, no repetition
- Write in American English`;
}

export function buildHowToPrompt(keyword, niche) {
  return buildArticlePrompt(keyword, niche, {
    targetWordCount: 1400,
    schemaType: 'HowTo'
  });
}

export const AUTHOR_PERSONAS = {
  'home-improvement-costs': {
    name: 'James Crawford',
    title: 'Home Renovation Specialist',
    bio: 'James has spent 15 years in the home improvement industry, working as a contractor before becoming a consumer advocate helping homeowners understand real project costs.',
    avatar: 'james-crawford'
  },
  'pet-care-by-breed': {
    name: 'Dr. Sarah Mitchell',
    title: 'Certified Pet Care Specialist',
    bio: 'Sarah is a certified animal behaviorist with 12 years of experience working with breed-specific health and care needs across veterinary clinics.',
    avatar: 'sarah-mitchell'
  },
  'software-error-fixes': {
    name: 'Alex Torres',
    title: 'Senior Systems Engineer',
    bio: 'Alex has 10+ years in IT support and systems engineering, having resolved thousands of software issues across enterprise and consumer environments.',
    avatar: 'alex-torres'
  },
  'diet-specific-recipes': {
    name: 'Emma Rodriguez',
    title: 'Nutritionist & Recipe Developer',
    bio: 'Emma is a registered nutritionist who has spent 8 years developing diet-specific recipes for clients with various dietary restrictions and health goals.',
    avatar: 'emma-rodriguez'
  },
  'small-town-tourism': {
    name: 'Marcus Webb',
    title: 'Travel Writer & Explorer',
    bio: 'Marcus has visited over 300 small towns across North America and Europe, writing about hidden gems and local experiences for major travel publications.',
    avatar: 'marcus-webb'
  }
};
