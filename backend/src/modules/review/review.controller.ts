import { Request, Response, NextFunction } from 'express';
import { ReviewService } from './review.service';
import { AppError } from '../../shared/errors';

const service = new ReviewService();

export class ReviewController {
  private actor(req: Request) {
    return { id: req.user!.id, role: req.user!.role };
  }

  async inbox(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, ...await service.inbox(req.query as any, this.actor(req)) }); } catch (e) { next(e); }
  }

  async detail(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await service.detail(req.params.itemId, this.actor(req)) }); } catch (e) { next(e); }
  }

  async checks(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await service.listChecks(req.params.itemId, this.actor(req)) }); } catch (e) { next(e); }
  }

  async saveChecks(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await service.saveChecks(req.params.itemId, this.actor(req), req.body) }); } catch (e) { next(e); }
  }

  async observations(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await service.listObservations(req.params.itemId, this.actor(req)) }); } catch (e) { next(e); }
  }

  async createObservation(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json({ success: true, data: await service.createObservation(req.params.itemId, this.actor(req), req.body) }); } catch (e) { next(e); }
  }

  async resolveObservation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!/^\d+$/.test(req.params.id)) throw new AppError('Identificador de observación inválido', 400, 'INVALID_ID');
      res.json({ success: true, data: await service.resolveObservation(BigInt(req.params.id), this.actor(req), req.body.response) });
    } catch (e) { next(e); }
  }

  async respondObservation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!/^\d+$/.test(req.params.id)) throw new AppError('Identificador de observación inválido', 400, 'INVALID_ID');
      res.json({ success: true, data: await service.respondObservation(BigInt(req.params.id), this.actor(req), req.body.response) });
    } catch (e) { next(e); }
  }

  async startReview(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await service.startReview(req.params.itemId, this.actor(req)) }); } catch (e) { next(e); }
  }

  async returnForCorrection(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await service.returnForCorrection(req.params.itemId, this.actor(req), req.body) }); } catch (e) { next(e); }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await service.reject(req.params.itemId, this.actor(req), req.body) }); } catch (e) { next(e); }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await service.approve(req.params.itemId, this.actor(req), req.body) }); } catch (e) { next(e); }
  }

  async history(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await service.history(req.params.itemId, this.actor(req)) }); } catch (e) { next(e); }
  }
}
