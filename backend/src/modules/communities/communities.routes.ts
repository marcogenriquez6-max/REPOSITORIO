import { Router } from 'express';
import { CommunitiesController } from './communities.controller';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/roles.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCommunitySchema, listCommunitiesSchema, updateCommunitySchema } from './communities.dto';

const router = Router();
const controller = new CommunitiesController();

router.get('/', optionalAuthenticate, validate(listCommunitiesSchema, 'query'), (req, res, next) => controller.list(req, res, next));
router.get('/:id', optionalAuthenticate, (req, res, next) => controller.getById(req, res, next));
router.post('/', authenticate, authorize('ADMIN'), validate(createCommunitySchema), (req, res, next) => controller.create(req, res, next));
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateCommunitySchema), (req, res, next) => controller.update(req, res, next));

export default router;
