import { anthropic, AI_MODEL } from './client'
import type { CompatibilityResult, PersonalityScores, RevealStage } from '@aura/shared'

interface ProfileData {
  name: string
  age: number
  bio?: string
  occupation?: string
  interests: string[]
  relationshipGoal: string
  prompts: { question: string; answer: string }[]
  personalityScores: PersonalityScores
}

function getRevealStage(score: number): RevealStage {
  if (score < 30) return 'AURA_ONLY'
  if (score < 60) return 'SILHOUETTE'
  if (score < 80) return 'PARTIAL'
  return 'FULL'
}

export async function calculateCompatibility(
  profileA: ProfileData,
  profileB: ProfileData
): Promise<CompatibilityResult> {
  // Vector-based personality compatibility (OCEAN model)
  const personalityScore = calculatePersonalityCompatibility(
    profileA.personalityScores,
    profileB.personalityScores
  )

  // Interest overlap score
  const interestScore = calculateInterestOverlap(profileA.interests, profileB.interests)

  // Goal alignment
  const goalScore = profileA.relationshipGoal === profileB.relationshipGoal ? 100 : 50

  // AI deep analysis
  const aiAnalysis = await getAICompatibilityInsight(profileA, profileB)

  const dimensions = {
    values: aiAnalysis.values,
    communication: aiAnalysis.communication,
    lifestyle: aiAnalysis.lifestyle,
    interests: interestScore,
    goals: goalScore,
    personality: personalityScore,
  }

  const overallScore = Math.round(
    Object.values(dimensions).reduce((sum, v) => sum + v, 0) / Object.keys(dimensions).length
  )

  return {
    overallScore,
    dimensions,
    aiInsight: aiAnalysis.insight,
    revealStage: getRevealStage(overallScore),
  }
}

function calculatePersonalityCompatibility(a: PersonalityScores, b: PersonalityScores): number {
  // High similarity on O, C, A = good; complementary on E and N
  const opennessSim = 100 - Math.abs(a.openness - b.openness)
  const conscientiousnessSim = 100 - Math.abs(a.conscientiousness - b.conscientiousness)
  const agreeablenessSim = 100 - Math.abs(a.agreeableness - b.agreeableness)
  // Slight complementarity on extraversion (opposite attract a little)
  const extraversionScore = 100 - Math.abs(a.extraversion - b.extraversion) * 0.5
  const neuroticismScore = 100 - (a.neuroticism + b.neuroticism) / 2

  return Math.round(
    (opennessSim + conscientiousnessSim + agreeablenessSim + extraversionScore + neuroticismScore) / 5
  )
}

function calculateInterestOverlap(interestsA: string[], interestsB: string[]): number {
  if (!interestsA.length || !interestsB.length) return 50
  const setB = new Set(interestsB.map((i) => i.toLowerCase()))
  const shared = interestsA.filter((i) => setB.has(i.toLowerCase())).length
  const union = new Set([...interestsA, ...interestsB].map((i) => i.toLowerCase())).size
  return Math.round((shared / union) * 100)
}

async function getAICompatibilityInsight(
  profileA: ProfileData,
  profileB: ProfileData
): Promise<{ values: number; communication: number; lifestyle: number; insight: string }> {
  const prompt = `You are an expert relationship psychologist and compatibility analyst for a dating app called AURA.

Analyze the compatibility between these two people and provide scores (0-100) for each dimension plus a brief, warm insight.

Person A:
- Name: ${profileA.name}, Age: ${profileA.age}
- Bio: ${profileA.bio || 'Not provided'}
- Occupation: ${profileA.occupation || 'Not provided'}
- Relationship goal: ${profileA.relationshipGoal}
- Prompts: ${profileA.prompts.map((p) => `Q: ${p.question} A: ${p.answer}`).join(' | ')}

Person B:
- Name: ${profileB.name}, Age: ${profileB.age}
- Bio: ${profileB.bio || 'Not provided'}
- Occupation: ${profileB.occupation || 'Not provided'}
- Relationship goal: ${profileB.relationshipGoal}
- Prompts: ${profileB.prompts.map((p) => `Q: ${p.question} A: ${p.answer}`).join(' | ')}

Respond ONLY with valid JSON in this exact format:
{
  "values": <number 0-100>,
  "communication": <number 0-100>,
  "lifestyle": <number 0-100>,
  "insight": "<2-3 sentence warm, specific insight about why these two might connect>"
}`

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    return JSON.parse(text)
  } catch {
    return { values: 50, communication: 50, lifestyle: 50, insight: 'You two might have an interesting connection worth exploring.' }
  }
}
