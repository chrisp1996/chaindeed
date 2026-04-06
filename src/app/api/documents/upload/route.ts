import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToIpfs } from '@/lib/ipfs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const contractId = formData.get('contractId') as string;
    const docType = formData.get('docType') as string;
    const stepId = formData.get('stepId') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const { cid, url } = await uploadToIpfs(file, file.name);

    // Record in DB
    const doc = await prisma.generatedDocument.create({
      data: {
        contractId,
        docType: docType as any,
        ipfsCid: cid,
        generatedAt: new Date(),
      },
    });

    // If linked to an off-chain step, update it
    if (stepId) {
      await prisma.offChainStep.update({
        where: { id: stepId },
        data: { uploadedDocCid: cid, status: 'IN_PROGRESS' },
      });
    }

    // If it's a seller disclosure, update the contract flag
    if (docType === 'SELLER_DISCLOSURE' && contractId) {
      await prisma.contract.update({
        where: { id: contractId },
        data: { disclosureDelivered: true, sellerDisclosureCid: cid },
      });
    }

    return NextResponse.json({ cid, url, docId: doc.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
