import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { connectDatabase, prisma } from './config/prisma';
import apiRouter from './routes';
import { errorHandler, notFound } from './middlewares/error.middleware';

(BigInt.prototype as any).toJSON = function toJSON() { return this.toString(); };

const app = express();

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors({ origin: env.corsOrigin, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Storage is NEVER served statically; bitstreams must be downloaded via authorized endpoints.
app.use(`${env.apiPrefix}/auth`, rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false }));

app.use(env.apiPrefix, apiRouter);
app.use(notFound);
app.use(errorHandler);

async function bootstrap() {
  try {
    await connectDatabase();
    app.listen(env.port, () => {
      console.log(`UNIOR API listening on http://localhost:${env.port}${env.apiPrefix}`);
    });
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
