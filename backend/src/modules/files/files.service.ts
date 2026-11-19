import crypto from 'crypto';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { BitstreamBundle, ItemStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError, ForbiddenError, NotFoundError, assert } from '../../shared/errors';
import { removeFileSafe } from '../../config/multer';
import { isScopedReviewer } from '../../shared/access';

export async function hashAndValidatePdf(filePath: string): Promise<string> {
  // strict magic bytes check: %PDF-
  const fd = await fsp.open(filePath, 'r');
  try {
    const header = Buffer.alloc(5);
    await fd.read(header, 0, 5, 0);
    assert(header.toString('ascii') === '%PDF-', new AppError('Firma PDF inválida', 415, 'INVALID_PDF_SIGNATURE'));
  } finally {
    await fd.close();
  }

  const hash = crypto.createHash('sha256');
  await pipeline(fs.createReadStream(filePath), hash);
  return hash.digest('hex');
}

export class FilesService {
  async attachToItem(params: { itemId: string; actorId: string; actorRole: string; file: Express.Multer.File; bundle: BitstreamBundle; description?: string }) {
    const { itemId, actorId, actorRole, file, bundle, description } = params;
    try {
      assert(file.mimetype === 'application/pdf', new AppError('Solo se permiten archivos PDF', 415, 'INVALID_MIME'));
      const sha256 = await hashAndValidatePdf(file.path);

      const stored = await prisma.$transaction(async (tx) => {
        const item = await tx.item.findUnique({ where: { id: itemId }, select: { id: true, creatorId: true, status: true } });
        if (!item) throw new NotFoundError('Ítem no encontrado');
        const isOwner = item.creatorId === actorId;
        const isAdmin = actorRole === 'ADMIN';
        if (!isOwner && !isAdmin) throw new ForbiddenError('No autorizado para cargar archivos en este ítem');
        if (item.status !== ItemStatus.BORRADOR && item.status !== ItemStatus.OBSERVADO) {
          throw new AppError('Solo se pueden cargar archivos en BORRADOR u OBSERVADO', 409, 'INVALID_STATE');
        }

        const duplicate = await tx.bitstream.findFirst({ where: { itemId, sha256Hash: sha256, bundle } });
        if (duplicate) throw new AppError('Archivo duplicado (SHA-256)', 409, 'DUPLICATE_FILE');

        if (bundle === BitstreamBundle.ORIGINAL) {
          await tx.bitstream.updateMany({ where: { itemId, bundle: BitstreamBundle.ORIGINAL }, data: { isPrimary: false } });
        }

        const relPath = path.relative(env.storageRoot, file.path).replace(/\\/g, '/');
        const content = await fsp.readFile(file.path);
        return tx.bitstream.create({
          data: {
            itemId,
            bundle,
            isPrimary: bundle === BitstreamBundle.ORIGINAL,
            filePath: relPath,
            content,
            originalName: file.originalname,
            mimeType: 'application/pdf',
            sizeBytes: BigInt(file.size),
            sha256Hash: sha256,
            description: description ?? null,
          },
        });
      });

      return { ...stored, sizeBytes: stored.sizeBytes.toString() };
    } catch (e) {
      // on failure, discard uploaded temp file
      removeFileSafe(file.path);
      throw e;
    }
  }

  async getDownload(bitstreamId: string, requester?: { id: string; role: string }) {
    const b = await prisma.bitstream.findUnique({
      where: { id: bitstreamId },
      include: {
        item: { include: { collection: { select: { communityId: true } } } },
      },
    });
    if (!b) throw new NotFoundError('Archivo no encontrado');

    const item = b.item;
    const isOwner = requester?.id === item.creatorId;
    const isAdmin = requester?.role === 'ADMIN';
    const isAssignedReviewer = requester?.id === item.assignedReviewerId;
    let scopedReviewer = false;
    if (requester?.role === 'REVISOR') {
      scopedReviewer = await isScopedReviewer(requester.id, item.collection.communityId);
    }
    const privileged = isOwner || isAdmin || isAssignedReviewer || scopedReviewer;

    const now = new Date();
    const embargoActive = item.status === ItemStatus.EMBARGADO && item.embargoDate && item.embargoDate.getTime() > now.getTime();
    const isPublicOriginalAllowed = item.status === ItemStatus.PUBLICADO || (item.status === ItemStatus.EMBARGADO && !embargoActive);

    if (b.bundle === BitstreamBundle.ORIGINAL) {
      if (!isPublicOriginalAllowed && !privileged) {
        throw new ForbiddenError(embargoActive ? 'Documento en embargo' : 'Documento no disponible públicamente');
      }
    } else {
      // thumbnails/licenses: allow only if public/privileged
      if (!(item.status === ItemStatus.PUBLICADO || privileged)) {
        throw new ForbiddenError('Archivo no disponible');
      }
    }

    let content: Buffer;
    if (b.content) {
      content = Buffer.from(b.content);
    } else {
      const abs = path.resolve(env.storageRoot, b.filePath);
      const root = path.resolve(env.storageRoot);
      if (!abs.startsWith(root + path.sep) && abs !== root) throw new AppError('Ruta de archivo inválida', 400, 'INVALID_PATH');
      await fsp.access(abs);
      content = await fsp.readFile(abs);
    }

    await prisma.bitstream.update({ where: { id: b.id }, data: { downloadCount: { increment: 1 } } });
    return { content, name: b.originalName, mime: b.mimeType || 'application/pdf' };
  }
}
