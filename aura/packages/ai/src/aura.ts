import { anthropic, AI_MODEL } from './client'
import type { AuraData, PersonalityScores } from '@aura/shared'

const PATTERNS = ['waves', 'particles', 'geometric', 'fluid', 'crystalline'] as const

// Map OCEAN personality scores to visual aura properties
export function generateAuraFromPersonality(scores: PersonalityScores): AuraData {
  const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = scores

  // Color mapping based on personality
  const primaryColor = getPersonalityColor(openness, extraversion)
  const secondaryColor = getPersonalityColor(agreeableness, conscientiousness)
  const tertiaryColor = getPersonalityColor(100 - neuroticism, openness * 0.5)

  // Pattern based on conscientiousness vs openness
  const patternIndex = Math.floor((openness / 100) * (PATTERNS.length - 1))
  const pattern = PATTERNS[patternIndex]

  // Intensity from extraversion
  const intensity = extraversion / 100

  // Speed from neuroticism (anxious = faster)
  const speed = 0.2 + (neuroticism / 100) * 0.8

  // Complexity from openness
  const complexity = openness / 100

  const traits: AuraData['traits'] = [
    { name: 'Openness', value: openness / 100, color: '#6366f1' },
    { name: 'Warmth', value: agreeableness / 100, color: '#ec4899' },
    { name: 'Energy', value: extraversion / 100, color: '#f59e0b' },
    { name: 'Stability', value: (100 - neuroticism) / 100, color: '#10b981' },
    { name: 'Focus', value: conscientiousness / 100, color: '#3b82f6' },
  ]

  return {
    primaryColor,
    secondaryColor,
    tertiaryColor,
    pattern,
    intensity,
    speed,
    complexity,
    traits,
  }
}

function getPersonalityColor(score1: number, score2: number): string {
  // Generate HSL color from personality dimensions
  const hue = Math.floor((score1 / 100) * 360)
  const saturation = 60 + Math.floor((score2 / 100) * 30)
  const lightness = 45 + Math.floor((score1 / 100) * 20)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

interface OnboardingAnswer {
  question: string
  answer: string
}

export async function analyzePersonalityFromOnboarding(
  answers: OnboardingAnswer[]
): Promise<PersonalityScores> {
  const prompt = `You are a personality psychologist. Based on the user's answers to onboarding questions, estimate their Big Five (OCEAN) personality scores.

Onboarding answers:
${answers.map((a, i) => `${i + 1}. Q: ${a.question}\n   A: ${a.answer}`).join('\n')}

Respond ONLY with valid JSON:
{
  "openness": <0-100>,
  "conscientiousness": <0-100>,
  "extraversion": <0-100>,
  "agreeableness": <0-100>,
  "neuroticism": <0-100>
}

Base scores on linguistic cues, content themes, and expressed values in the answers.`

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    const scores = JSON.parse(text) as PersonalityScores
    // Clamp all values 0-100
    return {
      openness: Math.min(100, Math.max(0, scores.openness)),
      conscientiousness: Math.min(100, Math.max(0, scores.conscientiousness)),
      extraversion: Math.min(100, Math.max(0, scores.extraversion)),
      agreeableness: Math.min(100, Math.max(0, scores.agreeableness)),
      neuroticism: Math.min(100, Math.max(0, scores.neuroticism)),
    }
  } catch {
    return { openness: 60, conscientiousness: 60, extraversion: 60, agreeableness: 70, neuroticism: 40 }
  }
}
