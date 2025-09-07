import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { env } from './config/env';
import { logger } from './config/logger';
import { authPlugin } from './middlewares/auth';
import { authRoutes } from './modules/auth/routes';
import { caseRoutes } from './modules/cases/routes';
import { noteRoutes } from './modules/notes/routes';
import { attachmentRoutes } from './modules/attachments/routes';
import { userRoutes } from './modules/users/routes';
const app = Fastify({ logger });
app.register(cors, { origin: true, credentials: true });
app.register(rateLimit, { max: 300, timeWindow: '1 minute' });
app.register(jwt, { secret: env.JWT_SECRET });
app.register(authPlugin);
app.get('/health', async () => ({ ok: true }));
app.register(async (instance) => {
    await authRoutes(instance);
    await caseRoutes(instance);
    await noteRoutes(instance);
    await attachmentRoutes(instance);
    await userRoutes(instance);
}, { prefix: '/api' });
const start = async () => {
    try {
        await app.listen({ port: env.PORT, host: '0.0.0.0' });
        app.log.info(`Server running on :${env.PORT}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
// Only start if called directly
if (process.argv[1] && process.argv[1].includes('server')) {
    start();
}
export default app;
