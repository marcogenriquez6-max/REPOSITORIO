import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors';
import { env } from '../config/env';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Ruta no encontrada' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  const anyErr = err as any;
  if (anyErr?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, code: 'FILE_TOO_LARGE', message: 'Archivo excede el tamaño permitido' });
  }
  if (anyErr?.message === 'Solo se permiten archivos PDF') {
    return res.status(415).json({ success: false, code: 'INVALID_FILE_TYPE', message: 'Solo se permiten archivos PDF' });
  }

  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  if (!env.isProd) console.error(err);
  return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: env.isProd ? 'Error interno del servidor' : message });
}
