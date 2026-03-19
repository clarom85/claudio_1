import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '@aura/db'

export const profileRoutes: FastifyPluginAsync = async (app) => {
  const auth = [(app as any).authenticate]

  // GET /api/profiles/me — own profile
  app.get('/me', { preHandler: auth }, async (req) => {
    const userId = (req as any).user.sub

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        photos: { orderBy: { order: 'asc' } },
        interests: { include: { interest: true } },
        prompts: { include: { prompt: true }, orderBy: { order: 'asc' } },
        user: { select: { email: true, isPremium: true, subscription: true } },
      },
    })

    if (!profile) return { data: null }

    return {
      data: {
        ...profile,
        interests: profile.interests.map((i) => i.interest.name),
        prompts: profile.prompts.map((p) => ({ id: p.id, question: p.prompt.question, answer: p.answer })),
        isPremium: profile.user.isPremium,
        subscription: profile.user.subscription,
      },
    }
  })

  // PATCH /api/profiles/me — update profile
  app.patch('/me', { preHandler: auth }, async (req) => {
    const userId = (req as any).user.sub
    const body = z.object({
      bio: z.string().max(500).optional(),
      occupation: z.string().optional(),
      city: z.string().optional(),
      searchRadius: z.number().min(1).max(200).optional(),
      minAgePreference: z.number().min(18).optional(),
      maxAgePreference: z.number().max(99).optional(),
      genderPreference: z.array(z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'])).optional(),
      isVisible: z.boolean().optional(),
    }).parse(req.body)

    const profile = await prisma.profile.update({
      where: { userId },
      data: body,
    })

    return { data: profile }
  })

  // GET /api/profiles/:id — view other profile
  app.get('/:id', { preHandler: auth }, async (req, reply) => {
    const userId = (req as any).user.sub
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params)

    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { order: 'asc' } },
        interests: { include: { interest: true } },
        prompts: { include: { prompt: true }, orderBy: { order: 'asc' } },
      },
    })

    if (!profile) return reply.status(404).send({ error: 'Profile not found' })

    // Check if there's a match to determine reveal stage
    const match = await prisma.match.findFirst({
      where: {
        status: 'MATCHED',
        OR: [
          { fromUserId: userId, toUserId: profile.userId },
          { fromUserId: profile.userId, toUserId: userId },
        ],
      },
    })

    const revealStage = match?.revealStage ?? 'AURA_ONLY'

    return {
      data: {
        id: profile.id,
        name: profile.name,
        age: Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
        city: profile.city,
        bio: profile.bio,
        occupation: profile.occupation,
        auraData: profile.auraData,
        interests: profile.interests.map((i) => i.interest.name),
        prompts: profile.prompts.map((p) => ({ question: p.prompt.question, answer: p.answer })),
        photos: getRevealedPhotos(profile.photos, revealStage),
        revealStage,
      },
    }
  })
}

function getRevealedPhotos(photos: any[], stage: string): string[] {
  if (!photos.length) return []
  switch (stage) {
    case 'AURA_ONLY': return []
    case 'SILHOUETTE': return photos.map((p) => p.silhouetteUrl || p.blurredUrl || p.url)
    case 'PARTIAL': return [photos[0].url, ...photos.slice(1).map((p: any) => p.blurredUrl || p.url)]
    case 'FULL': return photos.map((p) => p.url)
    default: return []
  }
}
