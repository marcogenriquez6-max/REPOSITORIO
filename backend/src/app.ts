import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
import { env } from './config/env';
import { connectDatabase, prisma } from './config/prisma';
import apiRouter from './routes';
import { WorkflowService } from './modules/workflow/workflow.service';
import { errorHandler, notFound } from './middlewares/error.middleware';

(BigInt.prototype as any).toJSON = function toJSON() { return this.toString(); };

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.set('json replacer', (_key: string, value: unknown) => typeof value === 'bigint' ? value.toString() : value);
app.use((req, res, next) => {
  const requestId = req.header('x-request-id') || randomUUID();
  res.setHeader('X-Request-ID', requestId);
  (req as any).requestId = requestId;
  next();
});
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors({ origin: env.corsOrigin, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.use(`${env.apiPrefix}/auth`, rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
  handler: (req, res) => {
    const resetTime = (req as any).rateLimit?.resetTime as Date | undefined;
    const retryAfter = resetTime ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000)) : 900;
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ success: false, code: 'RATE_LIMITED', message: 'Demasiadas solicitudes. Intente nuevamente más tarde.' });
  },
}));

app.get('/handle/unior/:itemId', async (req, res, next) => {
  try {
    const id = req.params.itemId;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(404).json({ success: false, code: 'HANDLE_NOT_FOUND', message: 'Handle no encontrado' });
    }
    const item = await prisma.item.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!item || !['PUBLICADO', 'EMBARGADO'].includes(item.status)) {
      return res.status(404).json({ success: false, code: 'HANDLE_NOT_FOUND', message: 'Handle no encontrado' });
    }
    return res.redirect(302, `/items/${item.id}`);
  } catch (e) {
    return next(e);
  }
});

app.use(env.apiPrefix, apiRouter);
app.use(notFound);
app.use(errorHandler);

async function bootstrap() {
  try {
    await connectDatabase();
    const workflow = new WorkflowService();
    await workflow.releaseExpiredEmbargoes();
    const embargoTimer = setInterval(() => {
      void workflow.releaseExpiredEmbargoes().catch((err) => console.error('[unior-api] embargo job failed', err));
    }, 6 * 60 * 60 * 1000);
    embargoTimer.unref();
    const server = app.listen(env.port, () => {
      console.log(`UNIOR API listening on http://localhost:${env.port}${env.apiPrefix}`);
    });
    const shutdown = (signal: string) => {
      console.log(`${signal} received, shutting down gracefully`);
      const timeout = setTimeout(() => process.exit(1), 10000);
      timeout.unref();
      server.close(async () => {
        await prisma.$disconnect();
        clearTimeout(timeout);
        process.exit(0);
      });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  void bootstrap();
}

export default app;
