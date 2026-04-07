import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cd_session')?.value;
  const user = await getSessionUser(token || '');
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const [buyerContracts, sellerContracts] = await Promise.all([
      prisma.contract.findMany({
        where: { buyerId: user.id },
        include: { property: true, seller: { select: { id: true, name: true, email: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.contract.findMany({
        where: { sellerId: user.id },
        include: { property: true, buyer: { select: { id: true, name: true, email: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    // Merge and deduplicate (user might be both buyer and seller in edge cases)
    const all = [...buyerContracts, ...sellerContracts.filter(
      s => !buyerContracts.find(b => b.id === s.id)
    )].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json(all);
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 200 });
  }
}
