import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
export async function caseRoutes(fastify) {
    const listQuery = z.object({
        status: z.enum(['new', 'in_progress', 'waiting_on_parts', 'waiting_on_shop', 'resolved', 'closed', 'cancelled']).optional(),
        shopId: z.string().optional(),
        vin: z.string().optional(),
        roNumber: z.string().optional(),
        limit: z.coerce.number().min(1).max(100).default(50)
    });
    fastify.get('/cases', { preHandler: fastify.authenticate }, async (req, reply) => {
        const q = listQuery.parse(req.query);
        const user = req.authUser;
        const where = { orgId: user.orgId };
        if (q.status)
            where.status = q.status;
        if (q.shopId)
            where.shopId = q.shopId;
        if (q.vin)
            where.vin = q.vin;
        if (q.roNumber)
            where.roNumber = q.roNumber;
        const items = await prisma.case.findMany({
            where,
            take: q.limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, roNumber: true, vin: true, issueType: true, status: true, priority: true,
                summary: true, createdAt: true, updatedAt: true,
                shop: { select: { id: true, name: true } },
                createdBy: { select: { id: true, email: true } },
                assignedTo: { select: { id: true, email: true } },
            }
        });
        return reply.send(items);
    });
    const createBody = z.object({
        roNumber: z.string().min(1),
        vin: z.string().min(6),
        issueType: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
        summary: z.string().optional(),
        notes: z.string().optional(),
        shopId: z.string().optional()
    });
    fastify.post('/cases', { preHandler: fastify.authenticate }, async (req, reply) => {
        const body = createBody.parse(req.body);
        const user = req.authUser;
        // Prevent duplicates at the app level before hitting DB unique constraint
        const existing = await prisma.case.findFirst({
            where: { orgId: user.orgId, roNumber: body.roNumber, vin: body.vin }
        });
        if (existing) {
            return reply.code(409).send({ message: 'Case already exists for this RO# and VIN', caseId: existing.id });
        }
        try {
            const created = await prisma.case.create({
                data: {
                    orgId: user.orgId,
                    roNumber: body.roNumber,
                    vin: body.vin,
                    issueType: body.issueType,
                    priority: body.priority,
                    summary: body.summary,
                    notes: body.notes,
                    shopId: body.shopId,
                    createdById: user.sub
                },
                select: { id: true }
            });
            return reply.code(201).send(created);
        }
        catch (e) {
            if (e.code === 'P2002') {
                return reply.code(409).send({ message: 'Duplicate case', meta: e.meta });
            }
            throw e;
        }
    });
    fastify.get('/cases/:id', { preHandler: fastify.authenticate }, async (req, reply) => {
        const params = z.object({ id: z.string() }).parse(req.params);
        const user = req.authUser;
        const item = await prisma.case.findFirst({
            where: { id: params.id, orgId: user.orgId },
            include: {
                shop: true,
                createdBy: { select: { id: true, email: true } },
                assignedTo: { select: { id: true, email: true } },
                caseNotes: {
                    select: { id: true, body: true, createdAt: true, author: { select: { id: true, email: true } } },
                    orderBy: { createdAt: 'desc' }
                },
                caseAttachments: {
                    select: { id: true, filePath: true, mimeType: true, size: true, createdAt: true, uploadedBy: { select: { id: true, email: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!item)
            return reply.code(404).send({ message: 'Not found' });
        return reply.send(item);
    });
    const patchBody = z.object({
        status: z.enum(['new', 'in_progress', 'waiting_on_parts', 'waiting_on_shop', 'resolved', 'closed', 'cancelled']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        assignedToId: z.string().nullable().optional(),
        summary: z.string().optional(),
        notes: z.string().optional()
    });
    fastify.patch('/cases/:id', { preHandler: fastify.requireRole(['manager', 'admin']) }, async (req, reply) => {
        const params = z.object({ id: z.string() }).parse(req.params);
        const body = patchBody.parse(req.body);
        const user = req.authUser;
        const existing = await prisma.case.findFirst({ where: { id: params.id, orgId: user.orgId } });
        if (!existing)
            return reply.code(404).send({ message: 'Not found' });
        const updated = await prisma.case.update({
            where: { id: params.id },
            data: {
                status: body.status ?? existing.status,
                priority: body.priority ?? existing.priority,
                assignedToId: body.assignedToId === undefined ? existing.assignedToId : body.assignedToId,
                summary: body.summary ?? existing.summary,
                notes: body.notes ?? existing.notes
            }
        });
        return reply.send({ id: updated.id, updatedAt: updated.updatedAt });
    });
}
