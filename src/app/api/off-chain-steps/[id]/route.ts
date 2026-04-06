import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status, uploadedDocCid, notes, completedByUserId } = await req.json();

    const data: Record<string, unknown> = { status };
    if (uploadedDocCid) data.uploadedDocCid = uploadedDocCid;
    if (notes) data.notes = notes;
    if (completedByUserId) data.completedByUserId = completedByUserId;
    if (status === 'COMPLETE') data.completedAt = new Date();

    const step = await prisma.offChainStep.update({ where: { id: params.id }, data });

    // If this was a blocker and is now complete, check if all blockers are done
    if (step.isBlocker && status === 'COMPLETE') {
      const remainingBlockers = await prisma.offChainStep.count({
        where: { contractId: step.contractId, isBlocker: true, status: { not: 'COMPLETE' } },
      });
      if (remainingBlockers === 0) {
        // All blockers cleared — could trigger notification here
        await prisma.contract.update({
          where: { id: step.contractId },
          data: { status: 'ACTIVE' },
        }).catch(() => {}); // Non-fatal
      }
    }

    return NextResponse.json(step);
  } catch {
    return NextResponse.json({ error: 'Failed to update step' }, { status: 500 });
  }
}
