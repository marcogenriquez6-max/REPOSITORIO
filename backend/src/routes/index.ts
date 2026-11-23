import { Router } from 'express';
import { prisma } from '../config/prisma';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import communitiesRoutes from '../modules/communities/communities.routes';
import collectionsRoutes from '../modules/collections/collections.routes';
import itemsRoutes from '../modules/items/items.routes';
import filesRoutes from '../modules/files/files.routes';
import workflowRoutes from '../modules/workflow/workflow.routes';
import discoveryRoutes from '../modules/discovery/discovery.routes';
import statsRoutes from '../modules/stats/stats.routes';
import reviewRoutes from '../modules/review/review.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', service: 'unior-repositorio-api', timestamp: new Date().toISOString() });
});

router.get('/health/ready', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, status: 'ready', database: 'up', timestamp: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/communities', communitiesRoutes);
router.use('/collections', collectionsRoutes);
router.use('/items', itemsRoutes);
router.use('/files', filesRoutes);
router.use('/workflow', workflowRoutes);
router.use('/discovery', discoveryRoutes);
router.use('/stats', statsRoutes);
router.use('/review', reviewRoutes);

export default router;
