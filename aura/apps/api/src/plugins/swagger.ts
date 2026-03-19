import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import type { FastifyPluginAsync } from 'fastify'

export const swaggerPlugin: FastifyPluginAsync = fp(async (app) => {
  await app.register(swagger, {
    openapi: {
      info: { title: 'AURA API', version: '1.0.0', description: 'AURA Dating App API' },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  })
  await app.register(swaggerUi, { routePrefix: '/documentation' })
})
