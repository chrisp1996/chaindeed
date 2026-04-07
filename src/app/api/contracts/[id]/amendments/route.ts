import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET — list all amendments for a contract
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const amendments = await prisma.contractAmendment.findMany({
      where: { contractId: params.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(amendments);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

// POST — propose a new amendment
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { proposedBy, changes, summary, message, parentId } = await req.json();

    // Get current version number
    const existing = await prisma.contractAmendment.count({ where: { contractId: params.id } });

    // Supersede any pending amendments
    await prisma.contractAmendment.updateMany({
      where: { contractId: params.id, status: 'PENDING' },
      data: { status: 'SUPERSEDED' },
    });

    const amendment = await prisma.contractAmendment.create({
      data: {
        contractId: params.id,
        proposedBy,
        version: existing + 1,
        changes,
        summary,
        message: message || null,
        parentId: parentId || null,
      },
    });

    // Record in audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: proposedBy,
        action: 'AMENDMENT_PROPOSED',
        entityType: 'CONTRACT',
        entityId: params.id,
        metadata: { summary, version: existing + 1 },
      },
    });

    return NextResponse.json(amendment, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create amendment' }, { status: 500 });
  }
}
