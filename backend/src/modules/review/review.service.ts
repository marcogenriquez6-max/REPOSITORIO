import { Prisma, ItemStatus, ObservationType, ObservationStatus, WorkflowAction } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { isScopedReviewer } from '../../shared/access';
import { AppError, ForbiddenError, NotFoundError, assert } from '../../shared/errors';
import { ItemsService } from '../items/items.service';
import { WorkflowService } from '../workflow/workflow.service';
import { ChecksDto, DecisionDto, InboxDto, ObservationDto } from './review.dto';
import { CHECK_DEFS, computeChecks, type ItemForChecks } from './checks';

const itemsService = new ItemsService();
const workflow = new WorkflowService();

export class ReviewService {
  private async loadForChecks(itemId: string): Promise<ItemForChecks> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        metadata: true,
        bitstreams: true,
        collection: { include: { community: true } },
      },
    });
    if (!item) throw new NotFoundError('Ítem no encontrado');
    return item as unknown as ItemForChecks;
  }

  private async assertAccess(itemId: string, actor: { id: string; role: string }) {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true, status: true, creatorId: true, assignedReviewerId: true,
        collection: { select: { communityId: true } },
      },
    });
    assert(item, new NotFoundError('Ítem no encontrado'));
    if (actor.role === 'ADMIN') return item;
    if (actor.role === 'REVISOR') {
      const assigned = item.assignedReviewerId === actor.id;
      const scoped = await isScopedReviewer(actor.id, item.collection.communityId);
      assert(assigned || scoped, new ForbiddenError('Sin ámbito sobre este documento'));
      return item;
    }
    throw new ForbiddenError('Rol no autorizado para revisión');
  }

  async inbox(query: InboxDto, actor: { id: string; role: string }) {
    const reviewerStatuses: ItemStatus[] = [
      ItemStatus.EN_REVISION,
      ItemStatus.OBSERVADO,
      ItemStatus.PUBLICADO,
      ItemStatus.EMBARGADO,
    ];
    const allowedStatuses = actor.role === 'REVISOR' ? reviewerStatuses : null;
    if (allowedStatuses && query.status && !allowedStatuses.includes(query.status)) {
      throw new ForbiddenError('Estado no disponible para el rol de revisión');
    }

    const scopeWhere: Prisma.ItemWhereInput = {};
    if (query.collectionId) scopeWhere.collectionId = query.collectionId;
    if (query.communityId) scopeWhere.collection = { communityId: query.communityId };
    if (query.assignedToMe) scopeWhere.assignedReviewerId = actor.id;

    const contains = { contains: query.q ?? query.author, mode: 'insensitive' as const };
    const and: Prisma.ItemWhereInput[] = [];
    if (query.q) {
      and.push({ OR: [
        { metadata: { some: { element: 'title', value: contains } } },
        { metadata: { some: { element: 'contributor', qualifier: 'author', value: contains } } },
      ] });
    }
    if (query.author) {
      and.push({ metadata: { some: { element: 'contributor', qualifier: 'author', value: contains } } });
    }
    if (query.year) {
      and.push({ metadata: { some: { schema: 'dc', element: 'date', qualifier: 'issued', value: { startsWith: query.year } } } });
    }
    if (query.from || query.to) {
      const submittedAt: Prisma.DateTimeFilter = {};
      if (query.from) submittedAt.gte = new Date(query.from);
      if (query.to) submittedAt.lte = new Date(query.to);
      and.push({ submittedAt });
    }
    if (and.length) scopeWhere.AND = and;

    if (actor.role === 'REVISOR') {
      const [assignments, allCommunities] = await Promise.all([
        prisma.userFaculty.findMany({ where: { userId: actor.id }, select: { communityId: true } }),
        prisma.community.findMany({ select: { id: true, parentId: true } }),
      ]);
      const scopedIds = new Set<string>();
      for (const assignment of assignments) {
        let current: string | null = assignment.communityId;
        while (current) {
          scopedIds.add(current);
          current = allCommunities.find((c) => c.id === current)?.parentId ?? null;
        }
      }
      scopeWhere.OR = [
        ...(scopedIds.size ? [{ collection: { communityId: { in: [...scopedIds] } } }] : []),
        { assignedReviewerId: actor.id },
      ];
    }

    const where: Prisma.ItemWhereInput = {
      ...scopeWhere,
      status: query.status ?? { in: [ItemStatus.EN_REVISION, ItemStatus.OBSERVADO] },
    };
    const indicatorsWhere: Prisma.ItemWhereInput = allowedStatuses
      ? { AND: [scopeWhere, { status: { in: allowedStatuses } }] }
      : scopeWhere;

    const [total, rows] = await Promise.all([
      prisma.item.count({ where }),
      prisma.item.findMany({
        where,
        include: {
          metadata: {
            where: {
              OR: [
                { schema: 'dc', element: 'title', qualifier: null },
                { schema: 'dc', element: 'contributor', qualifier: 'author' },
                { schema: 'dc', element: 'date', qualifier: 'issued' },
                { schema: 'dc', element: 'type' },
              ],
            },
            orderBy: [{ element: 'asc' }, { qualifier: 'asc' }, { place: 'asc' }],
          },
          collection: { select: { id: true, name: true, community: { select: { id: true, name: true } } } },
          creator: { select: { id: true, fullName: true } },
          assignedReviewer: { select: { id: true, fullName: true } },
          _count: { select: { observations: true, reviewChecks: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    const [statusCounts, pendingObservations, approved, rejected] = await Promise.all([
      prisma.item.groupBy({ by: ['status'], where: indicatorsWhere, _count: { _all: true } }),
      prisma.observation.count({ where: { status: ObservationStatus.PENDIENTE, item: indicatorsWhere } }),
      prisma.item.count({ where: { AND: [indicatorsWhere, { publishedAt: { not: null } }] } }),
      prisma.workflowLog.count({ where: { action: WorkflowAction.RECHAZADO, item: indicatorsWhere } }),
    ]);

    return {
      items: rows,
      pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
      indicators: {
        byStatus: Object.fromEntries(statusCounts.map((r) => [r.status, r._count._all])),
        pendingObservations,
        approved,
        rejected,
      },
    };
  }

  async detail(itemId: string, actor: { id: string; role: string }) {
    return itemsService.getById(itemId, actor);
  }

  async saveChecks(itemId: string, actor: { id: string; role: string }, dto: ChecksDto) {
    const item = await this.assertAccess(itemId, actor);
    assert(item.status === ItemStatus.EN_REVISION || item.status === ItemStatus.OBSERVADO,
      new AppError('Solo se pueden guardar checks en revisión', 409, 'INVALID_STATE'));

    const full = await this.loadForChecks(itemId);
    const computed = computeChecks(full);
    const allowed = new Set<string>(CHECK_DEFS.map((c) => c.key));
    const submitted = new Map(dto.checks.map((c) => [c.key, c]));

    for (const check of dto.checks) {
      assert(allowed.has(check.key), new AppError(`Check desconocido: ${check.key}`, 422, 'UNKNOWN_CHECK'));
      if (check.passed && !computed[check.key]) {
        throw new AppError(`El check ${check.key} no cumple los requisitos documentales`, 422, 'CHECK_NOT_SATISFIED');
      }
    }

    return prisma.$transaction(async (tx) => {
      for (const def of CHECK_DEFS) {
        const value = submitted.get(def.key);
        const passed = value ? value.passed : computed[def.key];
        await tx.reviewCheck.upsert({
          where: { itemId_key: { itemId, key: def.key } },
          create: { itemId, key: def.key, label: def.label, passed, notes: value?.notes ?? null, checkedById: actor.id },
          update: { label: def.label, passed, notes: value?.notes ?? null, checkedById: actor.id, checkedAt: new Date() },
        });
      }
      return tx.reviewCheck.findMany({ where: { itemId }, orderBy: { key: 'asc' } });
    });
  }

  async listChecks(itemId: string, actor: { id: string; role: string }) {
    await this.assertAccess(itemId, actor);
    const stored = await prisma.reviewCheck.findMany({ where: { itemId }, orderBy: { key: 'asc' } });
    const computed = computeChecks(await this.loadForChecks(itemId));
    return CHECK_DEFS.map((def) => {
      const found = stored.find((s) => s.key === def.key);
      return {
        key: def.key,
        label: found?.label ?? def.label,
        mandatory: def.mandatory,
        passed: found?.passed ?? false,
        computed: computed[def.key],
        notes: found?.notes ?? null,
        checkedAt: found?.checkedAt ?? null,
      };
    });
  }

  async createObservation(itemId: string, actor: { id: string; role: string }, dto: ObservationDto) {
    await this.assertAccess(itemId, actor);
    return prisma.observation.create({
      data: {
        itemId,
        authorId: actor.id,
        type: dto.type,
        description: dto.description,
      },
      include: { author: { select: { id: true, fullName: true, role: true } } },
    });
  }

  async listObservations(itemId: string, actor: { id: string; role: string }) {
    await this.assertAccess(itemId, actor);
    return prisma.observation.findMany({
      where: { itemId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, fullName: true, role: true } },
        resolvedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async resolveObservation(id: bigint, actor: { id: string; role: string }, response: string) {
    const observation = await prisma.observation.findUnique({
      where: { id },
      include: { item: { include: { collection: { select: { communityId: true } } } } },
    });
    assert(observation, new NotFoundError('Observación no encontrada'));
    if (actor.role !== 'ADMIN') {
      const scoped = await isScopedReviewer(actor.id, observation.item.collection.communityId);
      assert(observation.authorId === actor.id || scoped || observation.item.creatorId === actor.id,
        new ForbiddenError('No autorizado para resolver esta observación'));
    }
    assert(observation.status === ObservationStatus.PENDIENTE,
      new AppError('La observación ya fue resuelta', 409, 'ALREADY_RESOLVED'));
    return prisma.observation.update({
      where: { id },
      data: { status: ObservationStatus.RESUELTA, response, resolvedById: actor.id, resolvedAt: new Date() },
      include: { author: { select: { id: true, fullName: true } } },
    });
  }

  async startReview(itemId: string, actor: { id: string; role: string }) {
    await this.assertAccess(itemId, actor);
    assert(actor.role === 'ADMIN' || actor.role === 'REVISOR',
      new ForbiddenError('Solo revisores pueden iniciar la revisión'));
    return workflow.startReview(itemId, actor.id);
  }

  async returnForCorrection(itemId: string, actor: { id: string; role: string }, dto: DecisionDto) {
    await this.assertAccess(itemId, actor);
    assert(actor.role === 'ADMIN' || actor.role === 'REVISOR', new ForbiddenError('Acción no permitida'));
    const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId }, select: { status: true } });
    assert(item.status === ItemStatus.EN_REVISION, new AppError('Solo ítems EN_REVISION pueden devolverse', 409, 'INVALID_STATE'));
    await prisma.observation.create({
      data: { itemId, authorId: actor.id, type: ObservationType.DEVOLUCION, description: dto.comment },
    });
    return workflow.returnForCorrection(itemId, actor.id, dto.comment);
  }

  async reject(itemId: string, actor: { id: string; role: string }, dto: DecisionDto) {
    await this.assertAccess(itemId, actor);
    assert(actor.role === 'ADMIN' || actor.role === 'REVISOR', new ForbiddenError('Acción no permitida'));
    const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId }, select: { status: true } });
    assert(item.status === ItemStatus.EN_REVISION, new AppError('Solo ítems EN_REVISION pueden rechazarse', 409, 'INVALID_STATE'));
    await prisma.observation.create({
      data: { itemId, authorId: actor.id, type: ObservationType.RECHAZO, description: dto.comment },
    });
    return workflow.reject(itemId, actor.id, dto.comment);
  }

  async approve(itemId: string, actor: { id: string; role: string }, dto: DecisionDto) {
    await this.assertAccess(itemId, actor);
    assert(actor.role === 'ADMIN' || actor.role === 'REVISOR', new ForbiddenError('Acción no permitida'));
    const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId }, select: { status: true } });
    assert(item.status === ItemStatus.EN_REVISION, new AppError('Solo ítems EN_REVISION pueden aprobarse', 409, 'INVALID_STATE'));

    const checks = await prisma.reviewCheck.findMany({ where: { itemId } });
    const computed = computeChecks(await this.loadForChecks(itemId));
    const missing = CHECK_DEFS.filter((def) => def.mandatory
      && !(checks.find((c) => c.key === def.key)?.passed && computed[def.key]));
    assert(missing.length === 0,
      new AppError(`Requisitos pendientes: ${missing.map((m) => m.label).join(', ')}`, 422, 'CHECKS_INCOMPLETE'));

    const pending = await prisma.observation.count({ where: { itemId, status: ObservationStatus.PENDIENTE } });
    assert(pending === 0, new AppError('Existen observaciones pendientes', 409, 'PENDING_OBSERVATIONS'));

    return workflow.approve(itemId, actor.id, { comment: dto.comment, embargoDate: dto.embargoDate });
  }

  async history(itemId: string, actor: { id: string; role: string }) {
    await this.assertAccess(itemId, actor);
    const [logs, observations] = await Promise.all([
      prisma.workflowLog.findMany({
        where: { itemId },
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { id: true, fullName: true, role: true } } },
      }),
      prisma.observation.findMany({
        where: { itemId },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, fullName: true, role: true } } },
      }),
    ]);
    return [
      ...logs.map((l) => ({
        kind: 'workflow' as const,
        id: String(l.id),
        date: l.createdAt,
        actor: l.actor,
        action: l.action satisfies WorkflowAction,
        fromStatus: l.fromStatus,
        toStatus: l.toStatus,
        comment: l.comment,
      })),
      ...observations.map((o) => ({
        kind: 'observation' as const,
        id: String(o.id),
        date: o.createdAt,
        actor: o.author,
        action: o.type,
        status: o.status,
        description: o.description,
        response: o.response,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
