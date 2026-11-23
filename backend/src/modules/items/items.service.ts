import { Prisma, ItemStatus, WorkflowAction } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { isScopedReviewer } from '../../shared/access';
import { AppError, ForbiddenError, NotFoundError, assert } from '../../shared/errors';
import { CreateItemDto, ListItemsDto, UpdateMetadataDto } from './items.dto';
import { buildItemsWhere } from './items.query';

const bitstreamInclude = {
  orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  select: {
    id: true,
    itemId: true,
    originalName: true,
    mimeType: true,
    sizeBytes: true,
    bundle: true,
    downloadCount: true,
    isPrimary: true,
    description: true,
    createdAt: true,
  },
} satisfies Prisma.BitstreamFindManyArgs;

const detailInclude = {
  metadata: { orderBy: [{ element: 'asc' }, { qualifier: 'asc' }, { place: 'asc' }] },
  bitstreams: bitstreamInclude,
  collection: { include: { community: true } },
  creator: { select: { id: true, fullName: true, email: true, role: true } },
  assignedReviewer: { select: { id: true, fullName: true, email: true } },
  reviewChecks: { orderBy: { key: 'asc' } },
  observations: { orderBy: { createdAt: 'desc' } },
  workflowLogs: { orderBy: { createdAt: 'desc' }, include: { actor: { select: { id: true, fullName: true, role: true } } } },
} satisfies Prisma.ItemInclude;

type DetailedItem = Prisma.ItemGetPayload<{ include: typeof detailInclude }>;

// Public views expose only catalog metadata; binaries are served by /files/:id/download.
function toPublicItem(item: DetailedItem) {
  return {
    id: item.id,
    status: item.status,
    embargoDate: item.embargoDate,
    viewCount: item.viewCount,
    publishedAt: item.publishedAt,
    submittedAt: item.submittedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    handleUri: item.handleUri,
    version: item.version,
    collection: item.collection,
    creator: item.creator ? { id: item.creator.id, fullName: item.creator.fullName } : null,
    metadata: item.metadata,
    bitstreams: item.bitstreams,
  };
}

const listMetadataInclude = {
  where: {
    OR: [
      { schema: 'dc', element: 'title', qualifier: null },
      { schema: 'dc', element: 'contributor', qualifier: 'author' },
      { schema: 'dc', element: 'date', qualifier: 'issued' },
      { schema: 'dc', element: 'type' },
      { schema: 'dc', element: 'description', qualifier: 'abstract' },
    ],
  },
  orderBy: [{ element: 'asc' as const }, { qualifier: 'asc' as const }, { place: 'asc' as const }],
};

export class ItemsService {
  private visibilityFilter(requester?: { id: string; role: string }): Prisma.ItemWhereInput {
    if (!requester) return { status: { in: [ItemStatus.PUBLICADO, ItemStatus.EMBARGADO] } };
    if (requester.role === 'ADMIN') return {};
    const own: Prisma.ItemWhereInput = { creatorId: requester.id };
    const assigned: Prisma.ItemWhereInput = { assignedReviewerId: requester.id };
    return {
      OR: [
        { status: { in: [ItemStatus.PUBLICADO, ItemStatus.EMBARGADO] } },
        own,
        ...(requester.role === 'REVISOR' ? [assigned] : []),
      ],
    };
  }

  async list(query: ListItemsDto, requester?: { id: string; role: string }) {
    const where = buildItemsWhere(query, requester, this.visibilityFilter(requester));

    const [total, items] = await Promise.all([
      prisma.item.count({ where }),
      prisma.item.findMany({
        where,
        include: {
          metadata: listMetadataInclude,
          collection: { select: { id: true, name: true, community: { select: { id: true, name: true } } } },
          creator: { select: { id: true, fullName: true } },
          assignedReviewer: { select: { id: true, fullName: true } },
          _count: { select: { bitstreams: true, observations: true } },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return {
      items,
      pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
    };
  }

  async getById(id: string, requester?: { id: string; role: string }) {
    const item = await prisma.item.findUnique({ where: { id }, include: detailInclude });
    if (!item) throw new NotFoundError('Ítem no encontrado');

    const isPublic = item.status === ItemStatus.PUBLICADO || item.status === ItemStatus.EMBARGADO;
    const isOwner = requester?.id === item.creatorId;
    const isAssigned = requester?.id === item.assignedReviewerId;
    const isAdmin = requester?.role === 'ADMIN';
    const scoped = requester?.role === 'REVISOR'
      ? await isScopedReviewer(requester.id, item.collection.communityId)
      : false;

    if (!isAdmin && !isOwner && !isAssigned && !isPublic && !scoped) {
      throw new ForbiddenError('No tiene acceso a este documento');
    }

    if (!isAdmin && !isOwner && !isAssigned && !scoped) {
      await prisma.item.update({ where: { id }, data: { viewCount: { increment: 1 } } });
      item.viewCount += 1;
      return toPublicItem(item);
    }

    return item;
  }

  async create(dto: CreateItemDto, actorId: string) {
    const collection = await prisma.collection.findUnique({ where: { id: dto.collectionId }, select: { id: true, isActive: true } });
    assert(collection, new NotFoundError('Colección no encontrada'));
    assert(collection.isActive, new AppError('La colección no está activa', 409, 'INACTIVE_COLLECTION'));

    return prisma.item.create({
      data: {
        collectionId: dto.collectionId,
        creatorId: actorId,
        status: ItemStatus.BORRADOR,
        metadata: {
          create: dto.metadata.map((m, index) => ({
            schema: m.schema || 'dc',
            element: m.element,
            qualifier: m.qualifier ?? null,
            value: m.value,
            lang: m.lang ?? 'es',
            place: index,
          })),
        },
      },
      include: detailInclude,
    });
  }

  async updateMetadata(itemId: string, dto: UpdateMetadataDto, actorId: string, role: string) {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { collection: { select: { communityId: true } } },
    });
    assert(item, new NotFoundError('Ítem no encontrado'));
    const canEdit = role === 'ADMIN' || item.creatorId === actorId
      || (role === 'REVISOR' && await isScopedReviewer(actorId, item.collection.communityId));
    assert(canEdit, new ForbiddenError('No autorizado para editar metadatos'));
    assert(item.status === ItemStatus.BORRADOR || item.status === ItemStatus.OBSERVADO,
      new AppError('Solo se pueden editar metadatos en BORRADOR u OBSERVADO', 409, 'INVALID_STATE'));

    return prisma.$transaction(async (tx) => {
      await tx.metadataValue.deleteMany({ where: { itemId } });
      await tx.metadataValue.createMany({
        data: dto.metadata.map((m, index) => ({
          itemId,
          schema: m.schema || 'dc',
          element: m.element,
          qualifier: m.qualifier ?? null,
          value: m.value,
          lang: m.lang ?? 'es',
          place: index,
        })),
      });
      await tx.item.update({ where: { id: itemId }, data: { version: { increment: 1 } } });
      return tx.item.findUniqueOrThrow({ where: { id: itemId }, include: detailInclude });
    });
  }

  async assignReviewer(itemId: string, reviewerId: string) {
    return prisma.$transaction(async (tx) => {
      const reviewer = await tx.user.findUnique({
        where: { id: reviewerId },
        select: { id: true, role: true, isActive: true },
      });
      assert(reviewer, new NotFoundError('Revisor no encontrado'));
      assert(reviewer.isActive && (reviewer.role === 'REVISOR' || reviewer.role === 'ADMIN'),
        new AppError('El usuario no puede ser asignado como revisor', 422, 'INVALID_REVIEWER'));

      const item = await tx.item.findUnique({
        where: { id: itemId },
        select: { id: true, version: true, status: true, collection: { select: { communityId: true } } },
      });
      assert(item, new NotFoundError('Ítem no encontrado'));
      const editableStatuses: ItemStatus[] = [ItemStatus.BORRADOR, ItemStatus.EN_REVISION, ItemStatus.OBSERVADO];
      assert(editableStatuses.includes(item.status),
        new AppError('Solo se puede asignar revisor en estados editables', 409, 'INVALID_STATE'));
      const scoped = reviewer.role === 'ADMIN' || await isScopedReviewer(reviewerId, item.collection.communityId);
      assert(scoped, new AppError('El revisor no tiene ámbito sobre esta comunidad', 422, 'REVIEWER_OUT_OF_SCOPE'));

      const updated = await tx.item.updateMany({
        where: { id: itemId, version: item.version },
        data: { assignedReviewerId: reviewerId, version: { increment: 1 } },
      });
      assert(updated.count === 1, new AppError('El documento fue modificado por otra solicitud', 409, 'CONCURRENT_UPDATE'));
      await tx.workflowLog.create({
        data: {
          itemId,
          actorId: reviewerId,
          action: WorkflowAction.REVISION_INICIADA,
          fromStatus: item.status,
          toStatus: item.status,
          comment: 'Revisor asignado por administración',
        },
      });
      return tx.item.findUniqueOrThrow({
        where: { id: itemId },
        select: { id: true, assignedReviewerId: true, version: true },
      });
    });
  }
}
