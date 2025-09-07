import { z } from 'zod';
import { prisma } from '../../config/prisma';
export async function noteRoutes(fastify) {
    const addBody = z.object({
        body: z.string().min(1)
    });
    fastify.post('/cases/:id/notes', { preHandler: fastify.authenticate }, async (req, reply) => {
        const params = z.object({ id: z.string() }).parse(req.params);
        const body = addBody.parse(req.body);
        const user = req.authUser;
        const parent = await prisma.case.findFirst({ where: { id: params.id, orgId: user.orgId } });
        if (!parent)
            return reply.code(404).send({ message: 'Case not found' });
        const note = await prisma.caseNote.create({
            data: { caseId: params.id, authorId: user.sub, body: body.body },
            select: { id: true, createdAt: true }
        });
        return reply.code(201).send(note);
    });
    fastify.get('/cases/:id/notes', { preHandler: fastify.authenticate }, async (req, reply) => {
        const params = z.object({ id: z.string() }).parse(req.params);
        const user = req.authUser;
        const parent = await prisma.case.findFirst({ where: { id: params.id, orgId: user.orgId } });
        if (!parent)
            return reply.code(404).send({ message: 'Case not found' });
        const notes = await prisma.caseNote.findMany({
            where: { caseId: params.id },
            orderBy: { createdAt: 'desc' },
            select: { id: true, body: true, createdAt: true, author: { select: { id: true, email: true } } }
        });
        return reply.send(notes);
    });
}
