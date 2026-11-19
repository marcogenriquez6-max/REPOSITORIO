import { prisma } from '../config/prisma';

export async function getCommunityChain(communityId: string): Promise<string[]> {
  const chain: string[] = [];
  let current: string | null = communityId;
  while (current) {
    chain.push(current);
    const c: { parentId: string | null } | null = await prisma.community.findUnique({
      where: { id: current },
      select: { parentId: true },
    });
    current = c?.parentId ?? null;
  }
  return chain;
}

export async function isScopedReviewer(userId: string, communityId: string): Promise<boolean> {
  const chain = await getCommunityChain(communityId);
  const assignment = await prisma.userFaculty.findFirst({
    where: { userId, communityId: { in: chain } },
    select: { id: true },
  });
  return !!assignment;
}
