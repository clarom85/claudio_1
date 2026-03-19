import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '@aura/db'
import { generateConversationStarters, generateAIResponse } from '@aura/ai'
import { requirePremium } from '../middleware/premium'

export const messageRoutes: FastifyPluginAsync = async (app) => {
  const auth = [(app as any).authenticate]

  // GET /api/messages/:matchId — message history
  app.get('/:matchId', { preHandler: auth }, async (req, reply) => {
    const userId = (req as any).user.sub
    const { matchId } = z.object({ matchId: z.string().uuid() }).parse(req.params)
    const { cursor, limit } = z.object({
      cursor: z.string().optional(),
      limit: z.coerce.number().default(50),
    }).parse(req.query)

    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) return reply.status(404).send({ error: 'Match not found' })
    if (match.fromUserId !== userId && match.toUserId !== userId) {
      return reply.status(403).send({ error: 'Forbidden' })
    }

    const messages = await prisma.message.findMany({
      where: { matchId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    })

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: { matchId, senderId: { not: userId }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })

    return {
      data: messages.reverse(),
      hasMore: messages.length === limit,
      nextCursor: messages.length > 0 ? messages[0].id : null,
    }
  })

  // POST /api/messages/:matchId/suggestions — AI conversation starters (Free: 3/day, Premium: unlimited)
  app.post('/:matchId/suggestions', { preHandler: auth }, async (req, reply) => {
    const userId = (req as any).user.sub
    const { matchId } = z.object({ matchId: z.string().uuid() }).parse(req.params)

    // Rate limit for free users
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.isPremium) {
      const cacheKey = `suggestions:${userId}:${new Date().toDateString()}`
      const count = parseInt(await (app as any).redis.get(cacheKey) || '0')
      if (count >= 3) {
        return reply.status(403).send({
          error: 'DailyLimitReached',
          message: 'Free users get 3 AI suggestions per day. Upgrade for unlimited.',
          upgradeRequired: true,
        })
      }
      await (app as any).redis.set(cacheKey, count + 1, { EX: 86400 })
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        fromUser: { include: { profile: { include: { interests: { include: { interest: true } }, prompts: { include: { prompt: true } } } } } },
        toUser: { include: { profile: { include: { interests: { include: { interest: true } }, prompts: { include: { prompt: true } } } } } },
      },
    })
    if (!match) return reply.status(404).send({ error: 'Match not found' })

    const myProfile = match.fromUserId === userId ? match.fromUser.profile : match.toUser.profile
    const partnerProfile = match.fromUserId === userId ? match.toUser.profile : match.fromUser.profile

    if (!myProfile || !partnerProfile) return reply.status(400).send({ error: 'Profiles incomplete' })

    const sharedInterests = myProfile.interests
      .map((i) => i.interest.name)
      .filter((name) => partnerProfile.interests.some((pi) => pi.interest.name === name))

    const starters = await generateConversationStarters(
      {
        name: myProfile.name,
        interests: myProfile.interests.map((i) => i.interest.name),
        prompts: myProfile.prompts.map((p) => ({ question: p.prompt.question, answer: p.answer })),
      },
      {
        name: partnerProfile.name,
        interests: partnerProfile.interests.map((i) => i.interest.name),
        prompts: partnerProfile.prompts.map((p) => ({ question: p.prompt.question, answer: p.answer })),
      },
      sharedInterests
    )

    return { data: starters }
  })

  // POST /api/messages/:matchId/ghostwrite — AI reply ghostwriter (Premium only)
  app.post('/:matchId/ghostwrite', {
    preHandler: [auth[0], requirePremium],
  }, async (req, reply) => {
    const userId = (req as any).user.sub
    const { matchId } = z.object({ matchId: z.string().uuid() }).parse(req.params)

    const messages = await prisma.message.findMany({
      where: { matchId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { sender: { include: { profile: true } } },
    })

    const context = messages
      .reverse()
      .map((m) => `${m.sender.profile?.name ?? 'Unknown'}: ${m.content}`)
      .join('\n')

    const myProfile = await prisma.profile.findUnique({ where: { userId } })
    const reply_ = await generateAIResponse(context, myProfile?.name ?? 'User')

    return { data: { suggestion: reply_ } }
  })

  // DELETE /api/messages/:matchId/:messageId — delete message
  app.delete('/:matchId/:messageId', { preHandler: auth }, async (req, reply) => {
    const userId = (req as any).user.sub
    const { matchId, messageId } = z.object({
      matchId: z.string().uuid(),
      messageId: z.string().uuid(),
    }).parse(req.params)

    const message = await prisma.message.findUnique({ where: { id: messageId } })
    if (!message || message.matchId !== matchId) return reply.status(404).send({ error: 'Not found' })
    if (message.senderId !== userId) return reply.status(403).send({ error: 'Forbidden' })

    await prisma.message.update({ where: { id: messageId }, data: { isDeleted: true } })
    return { data: { success: true } }
  })
}
