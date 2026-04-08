import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmailWithAttachment, buildExecutedContractEmail } from '@/lib/notifications';
import { renderToBuffer } from '@react-pdf/renderer';
import { ExecutedContractPDF } from '@/components/pdf/ExecutedContractPDF';
import React from 'react';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        property: true,
        buyer: { select: { id: true, name: true, email: true, walletAddress: true } },
        seller: { select: { id: true, name: true, email: true, walletAddress: true } },
        offChainSteps: { orderBy: { sortOrder: 'asc' } },
        signatures: true,
        generatedDocuments: true,
        dispute: true,
      },
    });
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    return NextResponse.json(contract);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const existing = await prisma.contract.findUnique({
      where: { id: params.id },
      select: { status: true },
    });

    const contract = await prisma.contract.update({
      where: { id: params.id },
      data: body,
      include: {
        buyer: { select: { id: true, name: true, email: true, walletAddress: true } },
        seller: { select: { id: true, name: true, email: true, walletAddress: true } },
        property: true,
        signatures: true,
      },
    });

    // When contract transitions to CLOSED, generate PDF and email both parties
    const justClosed = existing?.status !== 'CLOSED' && contract.status === 'CLOSED';
    if (justClosed) {
      sendExecutedContractEmails(contract).catch(err => console.error('PDF email error:', err));
    }

    return NextResponse.json(contract);
  } catch {
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}

async function sendExecutedContractEmails(contract: any) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chaindeed.vercel.app';
  const wd = (contract.wizardData as Record<string, any> | null) ?? {};
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const assetDescription =
    wd.assetDescription || wd.propertyAddress || contract.property?.streetAddress ||
    contract.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());

  const sellerSig = contract.signatures?.find((s: any) => s.role === 'seller' || s.role === 'SELLER');
  const buyerSig  = contract.signatures?.find((s: any) => s.role === 'buyer'  || s.role === 'BUYER');

  const pdfProps = {
    contractId: contract.id,
    contractType: contract.type,
    state: contract.state ?? undefined,
    createdAt: new Date(contract.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    executedAt: now,
    seller: {
      name: contract.seller?.name || wd.sellerName || 'Seller',
      email: contract.seller?.email || wd.sellerEmail,
      walletAddress: contract.seller?.walletAddress ?? undefined,
      signedAt: sellerSig?.signedAt ? new Date(sellerSig.signedAt).toLocaleDateString() : now,
      role: 'SELLER' as const,
    },
    buyer: {
      name: contract.buyer?.name || wd.buyerName || 'Buyer',
      email: contract.buyer?.email || wd.buyerEmail,
      walletAddress: contract.buyer?.walletAddress ?? undefined,
      signedAt: buyerSig?.signedAt ? new Date(buyerSig.signedAt).toLocaleDateString() : now,
      role: 'BUYER' as const,
    },
    propertyAddress: contract.property?.streetAddress || wd.propertyAddress || wd.address,
    parcelNumber: contract.property?.parcelNumber || wd.apn,
    assetDescription,
    legalDescription: wd.legalDescription,
    purchasePrice: contract.purchasePrice || wd.price || 0,
    earnestMoney: contract.earnestMoneyAmount || wd.earnestMoney,
    closingDate: contract.closingDate
      ? new Date(contract.closingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : wd.closingDate,
    inspectionDays: wd.inspectionDays ? Number(wd.inspectionDays) : undefined,
    covenants: Array.isArray(wd.covenants) ? wd.covenants : undefined,
    additionalTerms: wd.additionalNotes || wd.additionalTerms,
    conditions: wd.conditions,
    contractAddress: contract.contractAddress ?? undefined,
    chainId: contract.chainId ?? undefined,
    txHash: contract.txHash ?? undefined,
    blockNumber: contract.blockNumber ?? undefined,
  };

  const pdfBuffer = Buffer.from(
    await (renderToBuffer(React.createElement(ExecutedContractPDF, pdfProps) as any) as any)
  );

  const recipients: { email: string; name: string }[] = [];
  if (contract.buyer?.email)  recipients.push({ email: contract.buyer.email,  name: contract.buyer.name  || 'Buyer'  });
  if (contract.seller?.email) recipients.push({ email: contract.seller.email, name: contract.seller.name || 'Seller' });

  await Promise.all(
    recipients.map(({ email, name }) =>
      sendEmailWithAttachment(
        email,
        `Fully Executed Agreement — ${assetDescription}`,
        buildExecutedContractEmail(name, contract.id, assetDescription, appUrl),
        { filename: `ChainDeed-Contract-${contract.id.slice(0, 8)}.pdf`, content: pdfBuffer },
      )
    )
  );
}
