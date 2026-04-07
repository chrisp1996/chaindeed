import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { prisma } from '@/lib/prisma';
import { ContractPDF } from '@/components/pdf/ContractPDF';
import React from 'react';

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

// ─────────────────────────────────────────────────────────
// Mock data for demo IDs
// ─────────────────────────────────────────────────────────

function getMockProps(id: string) {
  const demos: Record<string, object> = {
    '1': {
      contractType: 'Real Estate Purchase',
      assetDescription: 'Single-family home at 1842 Oak Street, Cincinnati, OH 45202',
      sellerName: 'Jane Smith',
      buyerName: 'John Doe',
      price: 285000,
      createdAt: fmtDate(new Date(Date.now() - 86400000 * 5)),
      contractId: '1',
      state: 'OH',
      propertyAddress: '1842 Oak Street, Cincinnati, OH 45202',
      apn: '123-456-789',
      closingDate: fmtDate(new Date(Date.now() + 86400000 * 30)),
      inspectionDays: 10,
      covenants: [
        'Seller warrants they own this asset free and clear',
        'No undisclosed liens or encumbrances',
        'Asset is as described above',
        "Buyer's right to inspect before payment releases",
        'General warranty of title',
        'Seller disclosure of known defects',
        'Inspection contingency',
        'Title search required before closing',
        'Property taxes prorated at closing',
        'Ohio ORC 5302.30 Residential Property Disclosure',
        'Ohio conveyance fee acknowledged ($1 per $1,000 of sale price)',
      ],
      additionalNotes: 'Sale includes all appliances. Seller to provide home warranty.',
    },
    '2': {
      contractType: 'Simple Transaction',
      assetDescription: '2021 Toyota Camry XSE, VIN: 4T1G11AK0MU012345',
      sellerName: 'Alice Johnson',
      buyerName: 'Bob Williams',
      price: 22500,
      createdAt: fmtDate(new Date(Date.now() - 86400000 * 2)),
      contractId: '2',
      inspectionDays: 3,
      covenants: [
        'Seller warrants they own this asset free and clear',
        'No undisclosed liens or encumbrances',
        'Asset is as described above',
        "Buyer's right to inspect before payment releases",
      ],
    },
    '3': {
      contractType: 'Real Estate Purchase',
      assetDescription: 'Residential lot at 501 Maple Avenue, Louisville, KY 40202',
      sellerName: 'Robert Brown',
      buyerName: 'Sarah Davis',
      price: 195000,
      createdAt: fmtDate(new Date(Date.now() - 86400000 * 10)),
      contractId: '3',
      state: 'KY',
      propertyAddress: '501 Maple Avenue, Louisville, KY 40202',
      closingDate: fmtDate(new Date(Date.now() + 86400000 * 45)),
      inspectionDays: 10,
      covenants: [
        'Seller warrants they own this asset free and clear',
        'No undisclosed liens or encumbrances',
        'Asset is as described above',
        "Buyer's right to inspect before payment releases",
        'General warranty of title',
        'Seller disclosure of known defects',
        'Inspection contingency',
        'Title search required before closing',
        'Property taxes prorated at closing',
        'Kentucky attorney-supervised closing required',
        'Kentucky transfer tax acknowledged ($0.50 per $500)',
        'PVA notification after closing',
        "Kentucky Seller's Disclosure of Property Condition",
      ],
    },
  };

  return demos[id] ?? {
    contractType: 'Simple Transaction',
    assetDescription: 'Asset — see contract for details',
    sellerName: 'Seller',
    buyerName: 'Buyer',
    price: 0,
    createdAt: fmtDate(new Date()),
    contractId: id,
    covenants: [
      'Seller warrants they own this asset free and clear',
      'No undisclosed liens or encumbrances',
      'Asset is as described above',
    ],
  };
}

// ─────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  let pdfProps: object;

  // Try fetching from database first
  try {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        property: true,
        buyer: true,
        seller: true,
      },
    });

    if (contract) {
      // Extract wizard data for simple transactions
      const wizardData = (contract.wizardData as Record<string, unknown>) || {};
      const assetFields = (wizardData.assetFields as Record<string, string>) || {};

      // Build asset description
      let assetDescription = 'Asset';
      if (contract.property) {
        assetDescription = `${contract.property.propertyType || 'Property'} at ${contract.property.streetAddress}, ${contract.property.city}, ${contract.property.state} ${contract.property.zipCode}`;
      } else if (wizardData.assetTypeKey) {
        assetDescription = String(wizardData.assetTypeKey).replace(/_/g, ' ');
        if (assetFields.propertyAddress) {
          assetDescription += ` at ${assetFields.propertyAddress}`;
        } else if (assetFields.vehicleYear || assetFields.vehicleMake) {
          assetDescription = `${assetFields.vehicleYear || ''} ${assetFields.vehicleMake || ''} ${assetFields.vehicleModel || ''}`.trim();
        } else if (assetFields.businessName) {
          assetDescription = assetFields.businessName;
        } else if (assetFields.itemName) {
          assetDescription = assetFields.itemName;
        } else if (assetFields.assetName) {
          assetDescription = assetFields.assetName;
        }
      }

      // Extract agreed covenants from wizardData
      const covenantsMap = (wizardData.covenants as Record<string, boolean>) || {};
      const covenantLabels = Object.entries(covenantsMap)
        .filter(([, v]) => v)
        .map(([k]) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim());

      pdfProps = {
        contractType: contract.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        assetDescription,
        sellerName: contract.seller?.name || String(wizardData.sellerName || 'Seller'),
        buyerName: contract.buyer?.name || String(wizardData.buyerName || 'Buyer'),
        price: contract.purchasePrice || 0,
        createdAt: fmtDate(contract.createdAt),
        contractId: contract.id,
        state: contract.state || assetFields.state || undefined,
        propertyAddress: contract.property?.streetAddress
          ? `${contract.property.streetAddress}, ${contract.property.city}, ${contract.property.state} ${contract.property.zipCode}`
          : undefined,
        apn: contract.property?.apn || undefined,
        closingDate: contract.closingDate ? fmtDate(contract.closingDate) : undefined,
        inspectionDays: contract.inspectionDeadline
          ? Math.round((contract.inspectionDeadline.getTime() - contract.createdAt.getTime()) / 86400000)
          : undefined,
        covenants: covenantLabels.length > 0 ? covenantLabels : undefined,
        additionalNotes: String(wizardData.notes || '').trim() || undefined,
      };
    } else {
      // Fall through to mock data
      pdfProps = getMockProps(id);
    }
  } catch {
    // DB not available (dev without DB, etc.) — use mock
    pdfProps = getMockProps(id);
  }

  // Render PDF to buffer
  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(
      React.createElement(ContractPDF, pdfProps as any) as any
    );
  } catch (err) {
    console.error('PDF render error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }

  const contractIdDisplay = (pdfProps as { contractId?: string }).contractId || id;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="chaindeed-contract-${contractIdDisplay}.pdf"`,
      'Content-Length': buffer.length.toString(),
    },
  });
}
