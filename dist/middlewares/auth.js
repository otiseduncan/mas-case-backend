import fp from 'fastify-plugin';
export const authPlugin = fp(async function (fastify) {
    fastify.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify();
            request.authUser = request.user;
        }
        catch (err) {
            return reply.code(401).send({ message: 'Unauthorized' });
        }
    });
    fastify.decorate('requireRole', function (roles) {
        return async function (request, reply) {
            try {
                await fastify.authenticate(request, reply);
                const role = request.authUser?.role;
                if (!role || !roles.includes(role)) {
                    return reply.code(403).send({ message: 'Forbidden' });
                }
            }
            catch (err) {
                return reply.code(401).send({ message: 'Unauthorized' });
            }
        };
    });
});
