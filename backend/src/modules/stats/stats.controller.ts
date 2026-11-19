import { Request, Response, NextFunction } from 'express';
import { StatsService } from './stats.service';

const service = new StatsService();

export class StatsController {
  async overview(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await service.overview() }); } catch (e) { next(e); }
  }
}
