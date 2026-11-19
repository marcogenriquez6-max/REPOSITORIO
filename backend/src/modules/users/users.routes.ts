import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/roles.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { assignFacultiesSchema, createUserSchema, listUsersSchema, updateUserSchema } from './users.dto';

const router = Router();
const controller = new UsersController();

router.use(authenticate, authorize('ADMIN'));

router.get('/', validate(listUsersSchema, 'query'), (req, res, next) => controller.list(req, res, next));
router.get('/:id', (req, res, next) => controller.getById(req, res, next));
router.post('/', validate(createUserSchema), (req, res, next) => controller.create(req, res, next));
router.patch('/:id', validate(updateUserSchema), (req, res, next) => controller.update(req, res, next));
router.put('/:id/faculties', validate(assignFacultiesSchema), (req, res, next) => controller.assignFaculties(req, res, next));

export default router;
