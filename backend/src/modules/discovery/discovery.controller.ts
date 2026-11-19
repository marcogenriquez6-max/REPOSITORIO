import { Request, Response, NextFunction } from 'express';
import { DiscoveryService } from './discovery.service';

const service = new DiscoveryService();

export class DiscoveryController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      res.json({ success: true, ...await service.search(req.query as any, requester) });
    } catch (e) { next(e); }
  }
  async facets(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await service.facets() }); } catch (e) { next(e); }
  }
}
