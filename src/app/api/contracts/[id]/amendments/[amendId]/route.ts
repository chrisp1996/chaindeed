import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH — accept, decline, or mark as revised
export async function PATCH(req: NextRequest, { params }: { params: { id: string; amendId: string } }) {
  try {
    const { action, respondedBy } = await req.json();
    // action: 'accept' | 'decline' | 'revise'

    if (action === 'revise') {
      // Mark current as REVISED, caller will POST a new amendment
      const updated = await prisma.contractAmendment.update({
        where: { id: params.amendId },
        data: { status: 'REVISED', respondedAt: new Date(), respondedBy },
      });
      return NextResponse.json(updated);
    }

    const status = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
    const updated = await prisma.contractAmendment.update({
      where: { id: params.amendId },
      data: { status, respondedAt: new Date(), respondedBy },
    });

    // If accepted, update the contract status to PENDING_SIGNATURES
    if (action === 'accept') {
      await prisma.contract.update({
        where: { id: params.id },
        data: { status: 'PENDING_SIGNATURES' },
      });
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: respondedBy,
        action: `AMENDMENT_${status}`,
        entityType: 'CONTRACT',
        entityId: params.id,
        metadata: { amendId: params.amendId },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update amendment' }, { status: 500 });
  }
}
