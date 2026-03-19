import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '@aura/db'
import { calculateCompatibility } from '@aura/ai'
import type { ProfileCard } from '@aura/shared'

const discoveryQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(10),
  cursor: z.string().optional(),
})

export const discoveryRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/discovery — returns profile cards to swipe on
  app.get('/', {
    preHandler: [(app as any).authenticate],
  }, async (req) => {
    const userId = (req as any).user.sub
    const query = discoveryQuerySchema.parse(req.query)

    const myProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { interests: { include: { interest: true } }, prompts: { include: { prompt: true } } },
    })
    if (!myProfile) throw new Error('Profile not found')

    // Get already-seen users (matched or rejected)
    const seenMatches = await prisma.match.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    })
    const seenIds = seenMatches.map((m) => m.toUserId)
    seenIds.push(userId) // exclude self

    // Find candidates based on preferences
    const candidates = await prisma.profile.findMany({
      where: {
        userId: { notIn: seenIds },
        isVisible: true,
        user: { isActive: true, isBanned: false },
        gender: myProfile.genderPreference.length > 0
          ? { in: myProfile.genderPreference }
          : undefined,
        birthDate: {
          gte: new Date(new Date().setFullYear(new Date().getFullYear() - myProfile.maxAgePreference)),
          lte: new Date(new Date().setFullYear(new Date().getFullYear() - myProfile.minAgePreference)),
        },
      },
      include: {
        photos: { orderBy: { order: 'asc' } },
        interests: { include: { interest: true } },
        prompts: { include: { prompt: true }, orderBy: { order: 'asc' }, take: 3 },
      },
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
    })

    // Calculate compatibility and build profile cards
    const cards: ProfileCard[] = await Promise.all(
      candidates.map(async (candidate) => {
        const age = Math.floor(
          (Date.now() - candidate.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        )

        let compatibilityScore: number | undefined
        let revealStage: ProfileCard['revealStage'] = 'AURA_ONLY'

        if (myProfile.personalityScores && candidate.personalityScores) {
          try {
            const compat = await calculateCompatibility(
              {
                name: myProfile.name,
                age: Math.floor((Date.now() - myProfile.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
                bio: myProfile.bio || undefined,
                occupation: myProfile.occupation || undefined,
                interests: myProfile.interests.map((i) => i.interest.name),
                relationshipGoal: myProfile.relationshipGoal,
                prompts: myProfile.prompts.map((p) => ({ question: p.prompt.question, answer: p.answer })),
                personalityScores: myProfile.personalityScores as any,
              },
              {
                name: candidate.name,
                age,
                bio: candidate.bio || undefined,
                occupation: candidate.occupation || undefined,
                interests: candidate.interests.map((i) => i.interest.name),
                relationshipGoal: candidate.relationshipGoal,
                prompts: candidate.prompts.map((p) => ({ question: p.prompt.question, answer: p.answer })),
                personalityScores: candidate.personalityScores as any,
              }
            )

            // Save compatibility score
            await prisma.compatibilityScore.upsert({
              where: { fromProfileId_toProfileId: { fromProfileId: myProfile.id, toProfileId: candidate.id } },
              update: { overallScore: compat.overallScore, dimensions: compat.dimensions, aiInsight: compat.aiInsight },
              create: {
                fromProfileId: myProfile.id,
                toProfileId: candidate.id,
                overallScore: compat.overallScore,
                dimensions: compat.dimensions,
                aiInsight: compat.aiInsight,
              },
            })

            compatibilityScore = compat.overallScore
            revealStage = compat.revealStage
          } catch {
            // Fallback if AI fails
          }
        }

        // Apply progressive reveal to photos
        const photos = getRevealedPhotos(candidate.photos, revealStage)

        return {
          id: candidate.id,
          name: candidate.name,
          age,
          city: candidate.city || undefined,
          bio: candidate.bio || undefined,
          occupation: candidate.occupation || undefined,
          auraData: (candidate.auraData as any) || generateDefaultAura(),
          revealStage,
          photos,
          interests: candidate.interests.map((i) => i.interest.name),
          compatibilityScore,
          prompts: candidate.prompts.map((p) => ({
            question: p.prompt.question,
            answer: p.answer,
          })),
        }
      })
    )

    return {
      data: cards,
      hasMore: candidates.length === query.limit,
      nextCursor: candidates.length > 0 ? candidates[candidates.length - 1].id : null,
    }
  })

  // POST /api/discovery/like
  app.post('/like', {
    preHandler: [(app as any).authenticate],
  }, async (req, reply) => {
    const userId = (req as any).user.sub
    const { targetId, isSuperLike } = z.object({
      targetId: z.string().uuid(),
      isSuperLike: z.boolean().default(false),
    }).parse(req.body)

    const targetUser = await prisma.profile.findUnique({ where: { id: targetId } })
    if (!targetUser) return reply.status(404).send({ error: 'Profile not found' })

    // Check if target already liked us
    const existing = await prisma.match.findUnique({
      where: { fromUserId_toUserId: { fromUserId: targetUser.userId, toUserId: userId } },
    })

    if (existing?.status === 'PENDING') {
      // It's a match!
      await prisma.match.update({
        where: { id: existing.id },
        data: { status: 'MATCHED', matchedAt: new Date() },
      })

      // Create our side too (or update if exists)
      await prisma.match.upsert({
        where: { fromUserId_toUserId: { fromUserId: userId, toUserId: targetUser.userId } },
        update: { status: 'MATCHED', matchedAt: new Date() },
        create: { fromUserId: userId, toUserId: targetUser.userId, status: 'MATCHED', matchedAt: new Date(), isSuperLike },
      })

      return { data: { matched: true, matchId: existing.id } }
    }

    await prisma.match.upsert({
      where: { fromUserId_toUserId: { fromUserId: userId, toUserId: targetUser.userId } },
      update: { status: 'PENDING', isSuperLike },
      create: { fromUserId: userId, toUserId: targetUser.userId, status: 'PENDING', isSuperLike },
    })

    return { data: { matched: false } }
  })

  // POST /api/discovery/pass
  app.post('/pass', {
    preHandler: [(app as any).authenticate],
  }, async (req) => {
    const userId = (req as any).user.sub
    const { targetId } = z.object({ targetId: z.string().uuid() }).parse(req.body)

    const target = await prisma.profile.findUnique({ where: { id: targetId } })
    if (!target) return { data: { success: true } }

    await prisma.match.upsert({
      where: { fromUserId_toUserId: { fromUserId: userId, toUserId: target.userId } },
      update: { status: 'REJECTED' },
      create: { fromUserId: userId, toUserId: target.userId, status: 'REJECTED' },
    })

    return { data: { success: true } }
  })
}

function getRevealedPhotos(
  photos: { url: string; blurredUrl: string | null; silhouetteUrl: string | null }[],
  stage: ProfileCard['revealStage']
): string[] {
  if (!photos.length) return []

  switch (stage) {
    case 'AURA_ONLY':
      return [] // No photos — only aura shown
    case 'SILHOUETTE':
      return photos.map((p) => p.silhouetteUrl || p.blurredUrl || p.url)
    case 'PARTIAL':
      return [photos[0].url, ...photos.slice(1).map((p) => p.blurredUrl || p.url)]
    case 'FULL':
      return photos.map((p) => p.url)
  }
}

function generateDefaultAura() {
  return {
    primaryColor: 'hsl(270, 70%, 55%)',
    secondaryColor: 'hsl(180, 65%, 50%)',
    tertiaryColor: 'hsl(320, 60%, 55%)',
    pattern: 'fluid',
    intensity: 0.7,
    speed: 0.4,
    complexity: 0.6,
    traits: [],
  }
}
