// ─── AUTH ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface JWTPayload {
  sub: string // userId
  email: string
  iat: number
  exp: number
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────

export interface AuraData {
  primaryColor: string
  secondaryColor: string
  tertiaryColor: string
  pattern: 'waves' | 'particles' | 'geometric' | 'fluid' | 'crystalline'
  intensity: number  // 0-1
  speed: number      // 0-1
  complexity: number // 0-1
  traits: AuraTrait[]
}

export interface AuraTrait {
  name: string
  value: number // 0-1
  color: string
}

export interface PersonalityScores {
  openness: number        // 0-100
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
}

export interface ProfileCard {
  id: string
  name: string
  age: number
  city?: string
  bio?: string
  occupation?: string
  auraData: AuraData
  revealStage: RevealStage
  photos: string[]       // URLs (may be blurred)
  interests: string[]
  compatibilityScore?: number
  prompts: { question: string; answer: string }[]
}

export type RevealStage = 'AURA_ONLY' | 'SILHOUETTE' | 'PARTIAL' | 'FULL'

// ─── MATCHING ────────────────────────────────────────────────────────────────

export interface CompatibilityDimensions {
  values: number
  communication: number
  lifestyle: number
  interests: number
  goals: number
  personality: number
}

export interface CompatibilityResult {
  overallScore: number
  dimensions: CompatibilityDimensions
  aiInsight: string
  revealStage: RevealStage
}

// ─── CHAT ────────────────────────────────────────────────────────────────────

export interface MessagePayload {
  matchId: string
  type: 'TEXT' | 'IMAGE' | 'VOICE' | 'GIF' | 'REACTION'
  content?: string
  mediaUrl?: string
  replyToId?: string
}

export interface VibeCheckResult {
  score: number
  trend: 'rising' | 'stable' | 'declining'
  insights: string[]
  suggestedTopics: string[]
}

// ─── SOCKET EVENTS ───────────────────────────────────────────────────────────

export interface ServerToClientEvents {
  'message:new': (message: ChatMessage) => void
  'message:read': (data: { matchId: string; messageId: string }) => void
  'match:new': (match: MatchNotification) => void
  'typing:start': (data: { matchId: string; userId: string }) => void
  'typing:stop': (data: { matchId: string; userId: string }) => void
  'presence:update': (data: { userId: string; isOnline: boolean; lastSeen?: string }) => void
  'vibe:update': (data: { matchId: string; vibeCheck: VibeCheckResult }) => void
}

export interface ClientToServerEvents {
  'message:send': (payload: MessagePayload) => void
  'message:read': (data: { matchId: string; messageId: string }) => void
  'typing:start': (matchId: string) => void
  'typing:stop': (matchId: string) => void
  'match:join': (matchId: string) => void
  'match:leave': (matchId: string) => void
}

export interface ChatMessage {
  id: string
  matchId: string
  senderId: string
  type: string
  content?: string
  mediaUrl?: string
  replyToId?: string
  isRead: boolean
  reactions?: Record<string, string[]>
  sentimentScore?: number
  createdAt: string
}

export interface MatchNotification {
  matchId: string
  userId: string
  name: string
  auraData: AuraData
  compatibilityScore: number
  matchedAt: string
}

// ─── API RESPONSES ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
