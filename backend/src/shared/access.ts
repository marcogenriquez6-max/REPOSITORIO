import { prisma } from '../config/prisma';

export async function getCommunityChain(communityId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    WITH RECURSIVE chain AS (
      SELECT id, parent_id
      FROM communities
      WHERE id = ${communityId}::uuid
      UNION
      SELECT c.id, c.parent_id
      FROM communities c
      INNER JOIN chain ch ON c.id = ch.parent_id
      WHERE ch.parent_id IS NOT NULL
    )
    SELECT id FROM chain
  `;
  return rows.map((row) => row.id);
}

export async function isScopedReviewer(userId: string, communityId: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ allowed: boolean }>>`
    WITH RECURSIVE chain AS (
      SELECT id, parent_id
      FROM communities
      WHERE id = ${communityId}::uuid
      UNION
      SELECT c.id, c.parent_id
      FROM communities c
      INNER JOIN chain ch ON c.id = ch.parent_id
      WHERE ch.parent_id IS NOT NULL
    )
    SELECT EXISTS (
      SELECT 1 FROM user_faculties uf
      WHERE uf.user_id = ${userId}::uuid
        AND uf.community_id IN (SELECT id FROM chain)
    ) AS allowed
  `;
  return rows[0]?.allowed ?? false;
}
