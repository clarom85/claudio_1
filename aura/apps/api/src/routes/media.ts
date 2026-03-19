import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '@aura/db'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import sharp from 'sharp'
import { randomUUID } from 'crypto'

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
})

const BUCKET = process.env.S3_BUCKET || 'aura-media'
const MAX_PHOTOS = 6
const MAX_SIZE_MB = 10

export const mediaRoutes: FastifyPluginAsync = async (app) => {
  const auth = [(app as any).authenticate]

  // POST /api/media/photos — upload profile photo
  app.post('/photos', { preHandler: auth }, async (req, reply) => {
    const userId = (req as any).user.sub
    const profile = await prisma.profile.findUnique({ where: { userId } })
    if (!profile) return reply.status(404).send({ error: 'Profile not found' })

    const photoCount = await prisma.photo.count({ where: { profileId: profile.id } })
    if (photoCount >= MAX_PHOTOS) {
      return reply.status(400).send({ error: `Maximum ${MAX_PHOTOS} photos allowed` })
    }

    const data = await req.file()
    if (!data) return reply.status(400).send({ error: 'No file provided' })

    const buffer = await data.toBuffer()
    if (buffer.length > MAX_SIZE_MB * 1024 * 1024) {
      return reply.status(400).send({ error: `File too large (max ${MAX_SIZE_MB}MB)` })
    }

    const id = randomUUID()

    // Process: original, blurred, silhouette
    const [originalBuffer, blurredBuffer, silhouetteBuffer] = await Promise.all([
      sharp(buffer).resize(800, 1000, { fit: 'cover' }).jpeg({ quality: 85 }).toBuffer(),
      sharp(buffer).resize(800, 1000, { fit: 'cover' }).blur(40).jpeg({ quality: 70 }).toBuffer(),
      sharp(buffer).resize(800, 1000, { fit: 'cover' }).greyscale().modulate({ brightness: 0.2 }).blur(20).jpeg({ quality: 60 }).toBuffer(),
    ])

    // Upload all three to S3
    const [originalKey, blurredKey, silhouetteKey] = [
      `photos/${userId}/${id}.jpg`,
      `photos/${userId}/${id}_blur.jpg`,
      `photos/${userId}/${id}_silhouette.jpg`,
    ]

    await Promise.all([
      s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: originalKey, Body: originalBuffer, ContentType: 'image/jpeg' })),
      s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: blurredKey, Body: blurredBuffer, ContentType: 'image/jpeg' })),
      s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: silhouetteKey, Body: silhouetteBuffer, ContentType: 'image/jpeg' })),
    ])

    const baseUrl = `${process.env.S3_ENDPOINT}/${BUCKET}`
    const photo = await prisma.photo.create({
      data: {
        profileId: profile.id,
        url: `${baseUrl}/${originalKey}`,
        blurredUrl: `${baseUrl}/${blurredKey}`,
        silhouetteUrl: `${baseUrl}/${silhouetteKey}`,
        order: photoCount,
      },
    })

    // Update profile completion score
    const newCount = photoCount + 1
    const completionBonus = Math.min(newCount * 5, 20) // Up to +20% for photos
    await prisma.profile.update({
      where: { id: profile.id },
      data: { completionScore: { increment: completionBonus } },
    })

    return reply.status(201).send({ data: photo })
  })

  // DELETE /api/media/photos/:photoId
  app.delete('/photos/:photoId', { preHandler: auth }, async (req, reply) => {
    const userId = (req as any).user.sub
    const { photoId } = req.params as { photoId: string }

    const photo = await prisma.photo.findUnique({ where: { id: photoId }, include: { profile: true } })
    if (!photo || photo.profile.userId !== userId) {
      return reply.status(404).send({ error: 'Photo not found' })
    }

    await prisma.photo.delete({ where: { id: photoId } })
    // Reorder remaining photos
    const remaining = await prisma.photo.findMany({ where: { profileId: photo.profileId }, orderBy: { order: 'asc' } })
    await Promise.all(remaining.map((p, i) => prisma.photo.update({ where: { id: p.id }, data: { order: i } })))

    return { data: { success: true } }
  })

  // PATCH /api/media/photos/reorder
  app.patch('/photos/reorder', { preHandler: auth }, async (req, reply) => {
    const userId = (req as any).user.sub
    const { order } = req.body as { order: string[] } // Array of photo IDs

    const profile = await prisma.profile.findUnique({ where: { userId } })
    if (!profile) return reply.status(404).send({ error: 'Profile not found' })

    await Promise.all(
      order.map((photoId, index) =>
        prisma.photo.updateMany({ where: { id: photoId, profileId: profile.id }, data: { order: index } })
      )
    )

    return { data: { success: true } }
  })
}
