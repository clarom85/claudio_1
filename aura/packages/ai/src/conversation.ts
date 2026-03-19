import { anthropic, AI_MODEL } from './client'
import type { VibeCheckResult } from '@aura/shared'

interface ConversationMessage {
  senderId: string
  content: string
  sentimentScore?: number
  createdAt: string
}

export async function generateConversationStarters(
  profileA: { name: string; interests: string[]; prompts: { question: string; answer: string }[] },
  profileB: { name: string; interests: string[]; prompts: { question: string; answer: string }[] },
  sharedInterests: string[]
): Promise<string[]> {
  const prompt = `You are a witty, warm conversation coach for a dating app called AURA.

Generate 5 unique, creative conversation starters for ${profileA.name} to send to ${profileB.name}.

Shared interests: ${sharedInterests.join(', ') || 'none yet'}

${profileB.name}'s prompts:
${profileB.prompts.map((p) => `Q: ${p.question}\nA: ${p.answer}`).join('\n')}

Rules:
- Each starter should be different in style (question, observation, playful challenge, etc.)
- Reference something specific from their profile/prompts
- Natural, not cheesy or cliché
- Max 2 sentences each

Respond ONLY with a JSON array of 5 strings.`

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'

  try {
    const starters = JSON.parse(text)
    return Array.isArray(starters) ? starters.slice(0, 5) : []
  } catch {
    return [
      "What's something you've been obsessing over lately?",
      'Your answer about [topic] caught my eye — tell me more!',
      "If we could only talk about one topic for a week, what should it be?",
    ]
  }
}

export async function analyzeVibeCheck(
  messages: ConversationMessage[],
  userAId: string,
  userBId: string
): Promise<VibeCheckResult> {
  if (messages.length < 4) {
    return {
      score: 50,
      trend: 'stable',
      insights: ['Keep the conversation going to unlock your vibe score!'],
      suggestedTopics: ['Share something about your day', 'Ask about their passions'],
    }
  }

  const recentMessages = messages.slice(-20)
  const conversation = recentMessages
    .map((m) => `${m.senderId === userAId ? 'A' : 'B'}: ${m.content}`)
    .join('\n')

  const prompt = `You are a relationship dynamics analyst for the dating app AURA.

Analyze this conversation and provide a vibe check assessment.

Conversation (last 20 messages):
${conversation}

Evaluate:
- Engagement balance (are both participating equally?)
- Emotional tone and depth
- Conversational momentum
- Connection signals

Respond ONLY with valid JSON:
{
  "score": <number 0-100>,
  "trend": "<rising|stable|declining>",
  "insights": ["<insight 1>", "<insight 2>"],
  "suggestedTopics": ["<topic 1>", "<topic 2>", "<topic 3>"]
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
    return {
      score: 60,
      trend: 'stable',
      insights: ['Your conversation is progressing naturally.'],
      suggestedTopics: ['Share a favorite memory', 'Talk about future plans', 'Discuss a shared interest'],
    }
  }
}

export async function generateAIResponse(
  conversationContext: string,
  senderName: string
): Promise<string> {
  // Ghost-writing assistant — helps users when they're stuck
  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `You're helping ${senderName} craft a reply in a dating app conversation.

Context: ${conversationContext}

Write ONE natural, genuine reply (1-2 sentences). Don't start with "I". Be warm and engaging.`,
      },
    ],
  })

  return response.content[0].type === 'text'
    ? response.content[0].text
    : "That's really interesting! Tell me more."
}
