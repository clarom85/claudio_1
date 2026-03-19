import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '@aura/db'

export const matchRoutes: FastifyPluginAsync = async (app) => {
  const auth = [(app as any).authenticate]

  // GET /api/matches — all active matches
  app.get('/', { preHandler: auth }, async (req) => {
    const userId = (req as any).user.sub

    const matches = await prisma.match.findMany({
      where: {
        status: 'MATCHED',
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: { include: { profile: { include: { photos: { orderBy: { order: 'asc' }, take: 1 } } } } },
        toUser: { include: { profile: { include: { photos: { orderBy: { order: 'asc' }, take: 1 } } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        vibeCheck: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    const formatted = matches.map((match) => {
      const partner = match.fromUserId === userId ? match.toUser : match.fromUser
      const partnerProfile = partner.profile
      const lastMessage = match.messages[0]

      return {
        id: match.id,
        matchedAt: match.matchedAt,
        revealStage: match.revealStage,
        compatibilityScore: match.compatibilityScore,
        vibeScore: match.vibeCheck?.score ?? null,
        vibeTrend: match.vibeCheck?.trend ?? null,
        partner: {
          id: partner.id,
          name: partnerProfile?.name ?? 'Unknown',
          photo: match.revealStage !== 'AURA_ONLY'
            ? partnerProfile?.photos[0]?.url ?? null
            : null,
          auraData: partnerProfile?.auraData ?? null,
          isOnline: partner.lastSeenAt
            ? Date.now() - new Date(partner.lastSeenAt).getTime() < 5 * 60 * 1000
            : false,
          lastSeenAt: partner.lastSeenAt,
        },
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              type: lastMessage.type,
              isOwn: lastMessage.senderId === userId,
              createdAt: lastMessage.createdAt,
              isRead: lastMessage.isRead,
            }
          : null,
        unreadCount: 0, // TODO: efficient unread count
      }
    })

    return { data: formatted }
  })

  // GET /api/matches/:id — single match detail
  app.get('/:id', { preHandler: auth }, async (req, reply) => {
    const userId = (req as any).user.sub
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params)

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        fromUser: { include: { profile: { include: { photos: true, interests: { include: { interest: true } }, prompts: { include: { prompt: true } } } } } },
        toUser: { include: { profile: { include: { photos: true, interests: { include: { interest: true } }, prompts: { include: { prompt: true } } } } } },
        vibeCheck: true,
      },
    })

    if (!match) return reply.status(404).send({ error: 'Match not found' })
    if (match.fromUserId !== userId && match.toUserId !== userId) {
      return reply.status(403).send({ error: 'Forbidden' })
    }

    const partner = match.fromUserId === userId ? match.toUser : match.fromUser
    const profile = partner.profile

    // Get AI compatibility insight
    const compatScore = await prisma.compatibilityScore.findFirst({
      where: {
        OR: [
          { fromProfileId: match.fromUser.profile?.id, toProfileId: match.toUser.profile?.id },
          { fromProfileId: match.toUser.profile?.id, toProfileId: match.fromUser.profile?.id },
        ],
      },
    })

    return {
      data: {
        id: match.id,
        matchedAt: match.matchedAt,
        revealStage: match.revealStage,
        compatibilityScore: match.compatibilityScore,
        vibeCheck: match.vibeCheck,
        aiInsight: compatScore?.aiInsight ?? null,
        dimensions: compatScore?.dimensions ?? null,
        partner: {
          id: partner.id,
          name: profile?.name,
          age: profile ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
          city: profile?.city,
          bio: profile?.bio,
          occupation: profile?.occupation,
          auraData: profile?.auraData,
          photos: getRevealedPhotos(profile?.photos ?? [], match.revealStage as any),
          interests: profile?.interests.map((i) => i.interest.name) ?? [],
          prompts: profile?.prompts.map((p) => ({ question: p.prompt.question, answer: p.answer })) ?? [],
        },
      },
    }
  })

  // DELETE /api/matches/:id — unmatch
  app.delete('/:id', { preHandler: auth }, async (req, reply) => {
    const userId = (req as any).user.sub
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params)

    const match = await prisma.match.findUnique({ where: { id } })
    if (!match) return reply.status(404).send({ error: 'Not found' })
    if (match.fromUserId !== userId && match.toUserId !== userId) {
      return reply.status(403).send({ error: 'Forbidden' })
    }

    await prisma.match.update({ where: { id }, data: { status: 'UNMATCHED' } })
    return { data: { success: true } }
  })

  // POST /api/matches/:id/report
  app.post('/:id/report', { preHandler: auth }, async (req, reply) => {
    const userId = (req as any).user.sub
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
    const { reason, details } = z.object({ reason: z.string(), details: z.string().optional() }).parse(req.body)

    const match = await prisma.match.findUnique({ where: { id } })
    if (!match) return reply.status(404).send({ error: 'Not found' })

    const reportedId = match.fromUserId === userId ? match.toUserId : match.fromUserId

    await prisma.report.create({ data: { reportedById: userId, reportedId, reason, details } })
    // Also block
    await prisma.match.update({ where: { id }, data: { status: 'BLOCKED' } })

    return { data: { success: true } }
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
