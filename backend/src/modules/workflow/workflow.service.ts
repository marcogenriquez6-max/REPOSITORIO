import { Prisma, ItemStatus, ObservationStatus, WorkflowAction, BitstreamBundle, UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError, NotFoundError, assert } from '../../shared/errors';
import { CHECK_DEFS, computeChecks, type ItemForChecks } from '../review/checks';

const ALLOWED: Record<ItemStatus, ItemStatus[]> = {
  [ItemStatus.BORRADOR]: [ItemStatus.EN_REVISION],
  [ItemStatus.EN_REVISION]: [ItemStatus.OBSERVADO, ItemStatus.PUBLICADO, ItemStatus.EMBARGADO],
  [ItemStatus.OBSERVADO]: [ItemStatus.EN_REVISION],
  [ItemStatus.PUBLICADO]: [ItemStatus.EMBARGADO],
  [ItemStatus.EMBARGADO]: [ItemStatus.PUBLICADO],
};

function hasDc(meta: { schema: string; element: string; qualifier: string | null; value: string }[], element: string, qualifier?: string | null) {
  return meta.some((m) => m.schema === 'dc' && m.element === element && (qualifier === undefined ? true : (m.qualifier ?? null) === (qualifier ?? null)) && (m.value?.trim()?.length ?? 0) > 0);
}

export class WorkflowService {
  private assertTransition(from: ItemStatus, to: ItemStatus) {
    const allowed = ALLOWED[from] || [];
    assert(allowed.includes(to), new AppError(`Transición inválida ${from} -> ${to}`, 409, 'INVALID_TRANSITION'));
  }

  private async updateWithVersion(
    tx: Prisma.TransactionClient,
    itemId: string,
    expectedVersion: number,
    data: Prisma.ItemUncheckedUpdateInput,
  ) {
    const result = await tx.item.updateMany({
      where: { id: itemId, version: expectedVersion },
      data: { ...data, version: { increment: 1 } },
    });
    if (result.count === 0) {
      throw new AppError('El documento fue modificado por otra solicitud', 409, 'CONCURRENT_UPDATE');
    }
    return tx.item.findUniqueOrThrow({ where: { id: itemId } });
  }

  async submit(itemId: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: itemId },
        include: { metadata: true, bitstreams: true },
      });
      if (!item) throw new NotFoundError('Ítem no encontrado');
      assert(item.creatorId === actorId, new AppError('Solo el creador puede enviar el ítem', 403, 'FORBIDDEN'));

      const from = item.status;
      const to = ItemStatus.EN_REVISION;
      this.assertTransition(from, to);

      // Minimal Dublin Core: title, author, issued, abstract, type, rights
      assert(hasDc(item.metadata as any, 'title', null), new AppError('Falta metadato dc.title', 422, 'METADATA_INCOMPLETE'));
      assert(hasDc(item.metadata as any, 'contributor', 'author'), new AppError('Falta metadato dc.contributor.author', 422, 'METADATA_INCOMPLETE'));
      assert(hasDc(item.metadata as any, 'date', 'issued'), new AppError('Falta metadato dc.date.issued', 422, 'METADATA_INCOMPLETE'));
      assert(hasDc(item.metadata as any, 'description', 'abstract'), new AppError('Falta metadato dc.description.abstract', 422, 'METADATA_INCOMPLETE'));
      assert(hasDc(item.metadata as any, 'type', null), new AppError('Falta metadato dc.type', 422, 'METADATA_INCOMPLETE'));
      assert(hasDc(item.metadata as any, 'rights', null), new AppError('Falta metadato dc.rights', 422, 'METADATA_INCOMPLETE'));

      const hasOriginal = item.bitstreams.some((b) => b.bundle === BitstreamBundle.ORIGINAL && b.isPrimary);
      assert(hasOriginal, new AppError('Se requiere al menos un archivo ORIGINAL primario', 422, 'FILE_REQUIRED'));

      const updated = await this.updateWithVersion(tx, itemId, item.version, {
        status: to,
        submittedAt: item.submittedAt ?? new Date(),
      });

      await tx.workflowLog.create({
        data: {
          itemId,
          actorId,
          action: WorkflowAction.ENVIADO,
          fromStatus: from,
          toStatus: to,
          comment: null,
        },
      });

      return { item: updated, status: to };
    });
  }

  async approve(itemId: string, reviewerId: string, opts: { comment?: string; embargoDate?: string }) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: itemId },
        include: {
          metadata: true,
          bitstreams: true,
          collection: { include: { community: true } },
        },
      });
      if (!item) throw new NotFoundError('Ítem no encontrado');

      const from = item.status;
      assert(from === ItemStatus.EN_REVISION, new AppError('Solo ítems EN_REVISION pueden aprobarse', 409, 'INVALID_STATE'));

      const computed = computeChecks(item as unknown as ItemForChecks);
      const storedChecks = await tx.reviewCheck.findMany({ where: { itemId } });
      const missing = CHECK_DEFS.filter((def) => def.mandatory
        && !(storedChecks.find((check) => check.key === def.key)?.passed && computed[def.key]));
      assert(missing.length === 0,
        new AppError(`Requisitos pendientes: ${missing.map((check) => check.label).join(', ')}`, 422, 'CHECKS_INCOMPLETE'));

      const pendingObservations = await tx.observation.count({
        where: { itemId, status: ObservationStatus.PENDIENTE },
      });
      assert(pendingObservations === 0,
        new AppError('Existen observaciones pendientes', 409, 'PENDING_OBSERVATIONS'));

      const embargoDate = opts.embargoDate ? new Date(opts.embargoDate + 'T00:00:00.000Z') : null;
      const to = embargoDate ? ItemStatus.EMBARGADO : ItemStatus.PUBLICADO;
      this.assertTransition(from, to);

      const handleUri = item.handleUri ?? `${env.publicBaseUrl}/handle/unior/${item.id}`;
      const publishedAt = item.publishedAt ?? new Date();

      const updated = await this.updateWithVersion(tx, itemId, item.version, {
        status: to,
        handleUri,
        publishedAt,
        embargoDate: embargoDate,
      });

      // ensure dc.identifier.uri metadata
      await tx.metadataValue.deleteMany({
        where: { itemId, schema: 'dc', element: 'identifier', qualifier: 'uri' },
      });
      await tx.metadataValue.create({
        data: { itemId, schema: 'dc', element: 'identifier', qualifier: 'uri', value: handleUri, place: 0 },
      });

      await tx.workflowLog.create({
        data: {
          itemId,
          actorId: reviewerId,
          action: embargoDate ? WorkflowAction.EMBARGADO : WorkflowAction.PUBLICADO,
          fromStatus: from,
          toStatus: to,
          comment: opts.comment ?? null,
        },
      });

      return { item: updated, status: to, handleUri };
    });
  }

  private async observeInTx(tx: Prisma.TransactionClient, itemId: string, reviewerId: string, comment: string, action: WorkflowAction) {
    const item = await tx.item.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundError('Ítem no encontrado');

    const from = item.status;
    const to = ItemStatus.OBSERVADO;
    assert(from === ItemStatus.EN_REVISION, new AppError('Solo ítems EN_REVISION pueden observarse', 409, 'INVALID_STATE'));
    this.assertTransition(from, to);

    const updated = await this.updateWithVersion(tx, itemId, item.version, { status: to });
    await tx.workflowLog.create({
      data: {
        itemId,
        actorId: reviewerId,
        action,
        fromStatus: from,
        toStatus: to,
        comment,
      },
    });

    return { item: updated, status: to };
  }

  async observe(itemId: string, reviewerId: string, comment: string, action: WorkflowAction = WorkflowAction.OBSERVADO) {
    return prisma.$transaction((tx) => this.observeInTx(tx, itemId, reviewerId, comment, action));
  }

  async startReview(itemId: string, reviewerId: string) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.item.findUniqueOrThrow({ where: { id: itemId } });
      assert(item.status === ItemStatus.EN_REVISION,
        new AppError('Solo ítems EN_REVISION pueden iniciar revisión', 409, 'INVALID_STATE'));
      assert(!item.assignedReviewerId || item.assignedReviewerId === reviewerId,
        new AppError('Este documento ya tiene un revisor asignado', 409, 'REVIEWER_ALREADY_ASSIGNED'));
      const updated = item.assignedReviewerId
        ? item
        : await this.updateWithVersion(tx, itemId, item.version, { assignedReviewerId: reviewerId });
      await tx.workflowLog.create({
        data: {
          itemId,
          actorId: reviewerId,
          action: WorkflowAction.REVISION_INICIADA,
          fromStatus: item.status,
          toStatus: item.status,
          comment: null,
        },
      });
      return updated;
    });
  }

  async returnForCorrection(itemId: string, reviewerId: string, comment: string, tx?: Prisma.TransactionClient) {
    return tx
      ? this.observeInTx(tx, itemId, reviewerId, comment, WorkflowAction.DEVUELTO)
      : this.observe(itemId, reviewerId, comment, WorkflowAction.DEVUELTO);
  }

  async reject(itemId: string, reviewerId: string, justification: string, tx?: Prisma.TransactionClient) {
    return tx
      ? this.observeInTx(tx, itemId, reviewerId, justification, WorkflowAction.RECHAZADO)
      : this.observe(itemId, reviewerId, justification, WorkflowAction.RECHAZADO);
  }

  async releaseExpiredEmbargoes() {
    return prisma.$transaction(async (tx) => {
      const expired = await tx.item.findMany({
        where: { status: ItemStatus.EMBARGADO, embargoDate: { lte: new Date() } },
        select: { id: true, version: true, status: true },
      });
      if (expired.length === 0) return 0;
      const actor = await tx.user.findFirst({
        where: { role: UserRole.ADMIN, isActive: true },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      assert(actor, new AppError('No hay administrador activo para registrar la liberación de embargos', 500, 'NO_ADMIN_ACTOR'));
      for (const item of expired) {
        await this.updateWithVersion(tx, item.id, item.version, { status: ItemStatus.PUBLICADO, embargoDate: null });
        await tx.workflowLog.create({
          data: {
            itemId: item.id,
            actorId: actor.id,
            action: WorkflowAction.PUBLICADO,
            fromStatus: item.status,
            toStatus: ItemStatus.PUBLICADO,
            comment: 'Embargo vencido',
          },
        });
      }
      return expired.length;
    });
  }
}
