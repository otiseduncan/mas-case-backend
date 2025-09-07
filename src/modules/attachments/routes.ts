import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'

export async function attachmentRoutes(fastify: FastifyInstance) {
  const addBody = z.object({
    filePath: z.string().min(3),
    mimeType: z.string().optional(),
    size: z.coerce.number().optional()
  })

  fastify.post('/cases/:id/attachments', { preHandler: fastify.authenticate }, async (req, reply) => {
    const params = z.object({ id: z.string() }).parse(req.params)
    const body = addBody.parse(req.body)
    const user = req.authUser!
    const parent = await prisma.case.findFirst({ where: { id: params.id, orgId: user.orgId } })
    if (!parent) return reply.code(404).send({ message: 'Case not found' })
    const att = await prisma.caseAttachment.create({
      data: {
        caseId: params.id,
        uploadedById: user.sub,
        filePath: body.filePath,
        mimeType: body.mimeType,
        size: body.size
      },
      select: { id: true, createdAt: true }
    })
    return reply.code(201).send(att)
  })

  fastify.get('/cases/:id/attachments', { preHandler: fastify.authenticate }, async (req, reply) => {
    const params = z.object({ id: z.string() }).parse(req.params)
    const user = req.authUser!
    const parent = await prisma.case.findFirst({ where: { id: params.id, orgId: user.orgId } })
    if (!parent) return reply.code(404).send({ message: 'Case not found' })
    const atts = await prisma.caseAttachment.findMany({
      where: { caseId: params.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, filePath: true, mimeType: true, size: true, createdAt: true }
    })
    return reply.send(atts)
  })
}
