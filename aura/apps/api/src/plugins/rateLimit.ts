import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'
import type { FastifyPluginAsync } from 'fastify'

export const rateLimitPlugin: FastifyPluginAsync = fp(async (app) => {
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => (req as any).user?.sub || req.ip,
    errorResponseBuilder: () => ({
      error: 'Too Many Requests',
      message: 'Slow down — you are moving too fast.',
      statusCode: 429,
    }),
  })
})
