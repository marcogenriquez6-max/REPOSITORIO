import { Router } from 'express';
import { CollectionsController } from './collections.controller';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/roles.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCollectionSchema, listCollectionsSchema, updateCollectionSchema } from './collections.dto';

const router = Router();
const controller = new CollectionsController();

router.get('/', optionalAuthenticate, validate(listCollectionsSchema, 'query'), (req, res, next) => controller.list(req, res, next));
router.get('/:id', optionalAuthenticate, (req, res, next) => controller.getById(req, res, next));
router.post('/', authenticate, authorize('ADMIN'), validate(createCollectionSchema), (req, res, next) => controller.create(req, res, next));
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateCollectionSchema), (req, res, next) => controller.update(req, res, next));

export default router;
