import { describe, expect, it } from 'vitest';
import { ItemStatus, Prisma } from '@prisma/client';
import { buildItemsWhere } from './items.query';
import type { ListItemsDto } from './items.dto';

const baseQuery = { page: 1, limit: 20 } as ListItemsDto;
const anonymousVisibility: Prisma.ItemWhereInput = {
  status: { in: [ItemStatus.PUBLICADO, ItemStatus.EMBARGADO] },
};

describe('buildItemsWhere', () => {
  it.each([ItemStatus.BORRADOR, ItemStatus.EN_REVISION, ItemStatus.OBSERVADO])(
    'keeps public visibility when an anonymous requester filters by %s',
    (status) => {
      const where = buildItemsWhere({ ...baseQuery, status }, undefined, anonymousVisibility);
      const filters = where.AND as Prisma.ItemWhereInput[];

      expect(where.status).toBeUndefined();
      expect(filters).toContainEqual(anonymousVisibility);
      expect(filters).toContainEqual({ status });
    },
  );

  it('combines the status filter with a public search query', () => {
    const where = buildItemsWhere(
      { ...baseQuery, status: ItemStatus.BORRADOR, q: 'tesis' },
      undefined,
      anonymousVisibility,
    );
    const filters = where.AND as Prisma.ItemWhereInput[];

    expect(filters).toHaveLength(3);
    expect(filters).toContainEqual(anonymousVisibility);
    expect(filters).toContainEqual({ status: ItemStatus.BORRADOR });
    expect(filters.some((filter) => Array.isArray(filter.OR))).toBe(true);
  });

  it('does not add an empty visibility filter for an admin', () => {
    const where = buildItemsWhere(
      { ...baseQuery, status: ItemStatus.BORRADOR },
      { id: 'admin-id', role: 'ADMIN' },
      {},
    );

    expect(where).toEqual({ AND: [{ status: ItemStatus.BORRADOR }] });
  });

  it('returns an unrestricted filter for an admin without query filters', () => {
    expect(buildItemsWhere(baseQuery, { id: 'admin-id', role: 'ADMIN' }, {})).toEqual({});
  });
});
