import { Router } from 'express';
import { DiscoveryController } from './discovery.controller';
import { optionalAuthenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { searchSchema } from './discovery.dto';

const router = Router();
const controller = new DiscoveryController();

router.get('/search', optionalAuthenticate, validate(searchSchema, 'query'), (req, res, next) => controller.search(req, res, next));
router.get('/facets', (req, res, next) => controller.facets(req, res, next));

export default router;
