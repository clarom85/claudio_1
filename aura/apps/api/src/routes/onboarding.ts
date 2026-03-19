import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '@aura/db'
import { analyzePersonalityFromOnboarding, generateAuraFromPersonality } from '@aura/ai'

const completeSchema = z.object({
  basics: z.object({
    name: z.string().min(2),
    birthDate: z.string(),
    gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER']),
    bio: z.string().optional(),
    occupation: z.string().optional(),
  }),
  answers: z.array(z.object({ question: z.string(), answer: z.string() })).min(3),
  interests: z.array(z.string()).min(3),
  relationshipGoal: z.enum(['LONG_TERM', 'SHORT_TERM', 'FRIENDSHIP', 'CASUAL', 'MARRIAGE', 'UNSURE']),
  genderPreference: z.array(z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'])).optional(),
  sexualOrientation: z.enum(['STRAIGHT', 'GAY', 'LESBIAN', 'BISEXUAL', 'PANSEXUAL', 'ASEXUAL', 'OTHER']).optional(),
})

export const onboardingRoutes: FastifyPluginAsync = async (app) => {
  const auth = [(app as any).authenticate]

  // POST /api/onboarding/complete
  app.post('/complete', { preHandler: auth }, async (req, reply) => {
    const userId = (req as any).user.sub
    const body = completeSchema.parse(req.body)

    // 1. Analyze personality with Claude
    const personalityScores = await analyzePersonalityFromOnboarding(body.answers)

    // 2. Generate aura data from personality
    const auraData = generateAuraFromPersonality(personalityScores)

    // 3. Upsert or find interests
    const interestRecords = await Promise.all(
      body.interests.map((name) =>
        prisma.interest.upsert({
          where: { name },
          update: {},
          create: { name, category: 'general' },
        })
      )
    )

    // 4. Update profile
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        name: body.basics.name,
        birthDate: new Date(body.basics.birthDate),
        gender: body.basics.gender,
        bio: body.basics.bio,
        occupation: body.basics.occupation,
        relationshipGoal: body.basics.gender as any,
        sexualOrientation: body.sexualOrientation ?? 'OTHER',
        genderPreference: body.genderPreference ?? [],
        personalityScores,
        auraData: auraData as any,
        completionScore: 80,
        interests: {
          deleteMany: {},
          create: interestRecords.map((i) => ({ interestId: i.id })),
        },
      },
      create: {
        userId,
        name: body.basics.name,
        birthDate: new Date(body.basics.birthDate),
        gender: body.basics.gender,
        bio: body.basics.bio,
        occupation: body.basics.occupation,
        relationshipGoal: body.relationshipGoal,
        sexualOrientation: body.sexualOrientation ?? 'OTHER',
        genderPreference: body.genderPreference ?? [],
        personalityScores,
        auraData: auraData as any,
        completionScore: 80,
        interests: {
          create: interestRecords.map((i) => ({ interestId: i.id })),
        },
      },
    })

    // 5. Save prompt answers (create prompt records if needed)
    for (let i = 0; i < body.answers.length; i++) {
      const { question, answer } = body.answers[i]
      const prompt = await prisma.prompt.upsert({
        where: { question } as any,
        update: {},
        create: { question, category: 'onboarding' },
      })

      await prisma.profilePrompt.upsert({
        where: { id: `${profile.id}-${i}` } as any,
        update: { answer, order: i },
        create: { profileId: profile.id, promptId: prompt.id, answer, order: i },
      })
    }

    return reply.status(201).send({
      data: {
        profileId: profile.id,
        personalityScores,
        auraData,
      },
    })
  })
}
