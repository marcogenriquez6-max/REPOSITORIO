import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { env } from './env';

const originalsDir = path.join(env.storageRoot, 'originals');
if (!fs.existsSync(originalsDir)) fs.mkdirSync(originalsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, originalsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

export const uploadPdf = multer({
  storage,
  limits: { fileSize: env.maxFileSizeBytes },
  fileFilter: (_req, file, cb) => {
    // Basic pre-check only; strict MIME + %PDF- signature validated in service
    const nameOk = path.extname(file.originalname).toLowerCase() === '.pdf';
    const mimeOk = file.mimetype === 'application/pdf' || file.mimetype === 'application/octet-stream';
    if (nameOk && mimeOk) return cb(null, true);
    cb(new Error('Solo se permiten archivos PDF'));
  },
});

export function removeFileSafe(filePath?: string | null) {
  if (!filePath) return;
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* ignore */ }
}