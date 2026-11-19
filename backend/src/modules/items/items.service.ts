import { Prisma, ItemStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { isScopedReviewer } from '../../shared/access';
import { AppError, ForbiddenError, NotFoundError, assert } from '../../shared/errors';
import { CreateItemDto, ListItemsDto, UpdateMetadataDto } from './items.dto';
import { buildItemsWhere } from './items.query';

const detailInclude = {
  metadata: { orderBy: [{ element: 'asc' }, { qualifier: 'asc' }, { place: 'asc' }] },
  bitstreams: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
  collection: { include: { community: true } },
  creator: { select: { id: true, fullName: true, email: true, role: true } },
  assignedReviewer: { select: { id: true, fullName: true, email: true } },
  reviewChecks: { orderBy: { key: 'asc' } },
  observations: { orderBy: { createdAt: 'desc' } },
  workflowLogs: { orderBy: { createdAt: 'desc' }, include: { actor: { select: { id: true, fullName: true, role: true } } } },
} satisfies Prisma.ItemInclude;

type DetailedItem = Prisma.ItemGetPayload<{ include: typeof detailInclude }>;

// Public views never expose internal review data (checks, observations, audit log, e-mails or hashes).
function toPublicItem(item: DetailedItem) {
  const { reviewChecks, observations, workflowLogs, assignedReviewer, assignedReviewerId, creator, bitstreams, ...rest } = item;
  return {
    ...rest,
    creator: creator ? { id: creator.id, fullName: creator.fullName } : null,
    bitstreams: bitstreams.map(({ filePath, sha256Hash, ...bitstream }) => bitstream),
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
    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId },
      select: { id: true, role: true, isActive: true },
    });
    assert(reviewer, new NotFoundError('Revisor no encontrado'));
    assert(reviewer.isActive && (reviewer.role === 'REVISOR' || reviewer.role === 'ADMIN'),
      new AppError('El usuario no puede ser asignado como revisor', 422, 'INVALID_REVIEWER'));

    const item = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true } });
    assert(item, new NotFoundError('Ítem no encontrado'));
    return prisma.item.update({
      where: { id: itemId },
      data: { assignedReviewerId: reviewerId, version: { increment: 1 } },
      select: { id: true, assignedReviewerId: true, version: true },
    });
  }
}
