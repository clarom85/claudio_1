import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@aura/db'

// Limits per tier
export const LIMITS = {
  free: { dailyLikes: 10, superLikes: 0, rewinds: 0, boosts: 0 },
  gold: { dailyLikes: Infinity, superLikes: 5, rewinds: 1, boosts: 1 },
  platinum: { dailyLikes: Infinity, superLikes: 10, rewinds: 3, boosts: 3 },
}

export async function checkDailyLikeLimit(req: FastifyRequest, reply: FastifyReply) {
  const userId = (req as any).user.sub
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return reply.status(401).send({ error: 'User not found' })

  if (user.isPremium) return // Premium users bypass limit

  // Count today's likes
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const todayLikes = await prisma.match.count({
    where: {
      fromUserId: userId,
      status: 'PENDING',
      createdAt: { gte: startOfDay },
    },
  })

  if (todayLikes >= LIMITS.free.dailyLikes) {
    return reply.status(403).send({
      error: 'DailyLimitReached',
      message: `You've used all ${LIMITS.free.dailyLikes} daily likes. Upgrade to Gold for unlimited likes.`,
      upgradeRequired: true,
    })
  }
}

export async function requirePremium(req: FastifyRequest, reply: FastifyReply) {
  const userId = (req as any).user.sub
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.isPremium) {
    return reply.status(403).send({
      error: 'PremiumRequired',
      message: 'This feature requires a premium subscription.',
      upgradeRequired: true,
    })
  }
}
