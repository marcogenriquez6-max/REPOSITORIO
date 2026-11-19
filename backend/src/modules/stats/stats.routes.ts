import { Router } from 'express';
import { StatsController } from './stats.controller';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/roles.middleware';

const router = Router();
const controller = new StatsController();

router.get('/overview', optionalAuthenticate, (req, res, next) => controller.overview(req, res, next));
router.get('/admin', authenticate, authorize('ADMIN'), (req, res, next) => controller.overview(req, res, next));

export default router;
