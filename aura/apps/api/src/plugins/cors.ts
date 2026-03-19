import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import type { FastifyPluginAsync } from 'fastify'

export const corsPlugin: FastifyPluginAsync = fp(async (app) => {
  await app.register(cors, {
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })
})
