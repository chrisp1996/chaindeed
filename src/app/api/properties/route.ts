import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mock ATTOM property lookup — replace with real ATTOM API in production
async function lookupProperty(address: string, state: string) {
  const county = getCountyFromAddress(address, state);
  return {
    found: true,
    streetAddress: address,
    state,
    county,
    currentOwnerName: 'Owner on Record', // ATTOM would populate this
    propertyType: 'residential',
    yearBuilt: null,
    squareFeet: null,
    ownershipVerified: false,
  };
}

function getCountyFromAddress(address: string, state: string): string {
  // In production, use ATTOM or Google Maps Geocoding
  return `${state} County`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const state = searchParams.get('state');

  if (address && state) {
    const result = await lookupProperty(address, state);
    return NextResponse.json(result);
  }

  const properties = await prisma.property.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json(properties);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const property = await prisma.property.create({ data: body });
    return NextResponse.json(property, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}
