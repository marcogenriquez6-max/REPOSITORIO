import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { isScopedReviewer } from '../shared/access';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../shared/errors';
import { Role } from '../shared/constants';

export function authorize(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!allowed.includes(req.user.role)) return next(new ForbiddenError('Permisos insuficientes'));
    next();
  };
}

export function authorizeReviewerScope(itemIdParam = 'itemId') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(new UnauthorizedError());
      if (req.user.role === 'ADMIN') return next();
      if (req.user.role !== 'REVISOR') return next(new ForbiddenError('Permisos insuficientes'));

      const itemId = req.params[itemIdParam];
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: { collection: { select: { communityId: true } } },
      });
      if (!item) return next(new NotFoundError('Ítem no encontrado'));

      const allowed = await isScopedReviewer(req.user.id, item.collection.communityId);
      if (!allowed) return next(new ForbiddenError('Revisor sin ámbito sobre esta facultad/carrera'));
      next();
    } catch (e) {
      next(e);
    }
  };
}
