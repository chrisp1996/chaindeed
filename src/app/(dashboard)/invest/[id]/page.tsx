'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import {
  ArrowLeft, MapPin, TrendingUp, Users, DollarSign, Shield,
  CheckCircle2, AlertTriangle, Building, Info, ChevronDown, ChevronUp,
  Bed, Bath, Ruler, Calendar, Percent, FileText, ChevronLeft, ChevronRight,
  Home, Car, Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';

// Photo sets per listing (Unsplash — real estate themed)
const PHOTOS: Record<string, string[]> = {
  '1': [
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=900&q=80',
    'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=900&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=80',
  ],
  '2': [
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=900&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80',
  ],
  '3': [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&q=80',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&q=80',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&q=80',
  ],
};

const SAMPLE_LISTINGS: Record<string, {
  id: string; address: string; city: string; state: string; zip: string;
  type: string; estimatedValue: number; targetRaise: number; raisedAmount: number;
  sharePrice: number; totalShares: number; projectedReturn: number; annualRent: number;
  minInvestment: number; accreditedOnly: boolean; status: string;
  description: string; longDescription: string;
  features: string[]; highlights: { icon: string; label: string; value: string }[];
  yearBuilt: number; sqft: number; bedBath: string; occupancy: number;
  monthlyRent: number; expenses: number; netIncome: number;
  neighborhood: string; walkScore: number; transitScore: number;
  documents: { name: string; type: string }[];
  risks: string[];
  updates: { date: string; text: string }[];
}> = {
  '1': {
    id: '1',
    address: '789 Maple Drive', city: 'Columbus', state: 'OH', zip: '43201',
    type: 'Single-Family Rental',
    estimatedValue: 275000, targetRaise: 200000, raisedAmount: 142000,
    sharePrice: 1000, totalShares: 200, projectedReturn: 9.2, annualRent: 19200,
    minInvestment: 1000, accreditedOnly: true, status: 'ACTIVE',
    description: 'Well-maintained 3BR/2BA single-family in established Columbus neighborhood.',
    longDescription: `This turnkey single-family rental in Columbus' coveted Short North adjacent neighborhood presents a compelling income opportunity. The property has been professionally managed since 2021 and benefits from strong rental demand driven by proximity to Ohio State University, Nationwide Children's Hospital, and a robust local job market.\n\nThe current tenant is on a 3-year lease at $1,600/month with a strong payment history. Recent improvements include a new roof (2022), updated HVAC system (2021), and fresh interior paint throughout. The property is in excellent condition with no deferred maintenance.\n\nColumbus continues to be one of the Midwest's fastest-growing cities, with sustained population growth and a diversified economy providing strong long-term fundamentals for residential real estate.`,
    features: ['3 bed / 2 bath', '1,450 sq ft', 'Built 2008', 'New roof 2022', 'New HVAC 2021', 'Currently rented'],
    highlights: [
      { icon: 'bed', label: 'Bedrooms', value: '3' },
      { icon: 'bath', label: 'Bathrooms', value: '2' },
      { icon: 'sqft', label: 'Square Feet', value: '1,450' },
      { icon: 'year', label: 'Year Built', value: '2008' },
      { icon: 'occupancy', label: 'Occupancy', value: '100%' },
      { icon: 'return', label: 'Proj. Return', value: '9.2%/yr' },
    ],
    yearBuilt: 2008, sqft: 1450, bedBath: '3 bed / 2 bath', occupancy: 100,
    monthlyRent: 1600, expenses: 4800, netIncome: 14400,
    neighborhood: 'Short North / Italian Village, Columbus OH',
    walkScore: 82, transitScore: 68,
    documents: [
      { name: 'Property Appraisal', type: 'PDF' },
      { name: 'Lease Agreement', type: 'PDF' },
      { name: 'Inspection Report', type: 'PDF' },
      { name: 'Title Report', type: 'PDF' },
    ],
    risks: [
      'Tenant may vacate at end of lease term requiring re-tenanting',
      'Property value may decrease in a down market',
      'Repair and maintenance costs may reduce distributions',
      'Liquidity is limited — shares cannot be sold instantly',
      'Columbus-specific regulations may affect rental income',
    ],
    updates: [
      { date: 'Mar 2026', text: 'Tenant renewed lease for additional 18 months at $1,650/month.' },
      { date: 'Jan 2026', text: 'Annual inspection completed. Property in excellent condition.' },
      { date: 'Oct 2025', text: 'Offering launched. 58% funded within first 30 days.' },
    ],
  },
  '2': {
    id: '2',
    address: '234 River Road', city: 'Louisville', state: 'KY', zip: '40202',
    type: 'Multi-Family',
    estimatedValue: 480000, targetRaise: 350000, raisedAmount: 350000,
    sharePrice: 2500, totalShares: 140, projectedReturn: 11.4, annualRent: 52800,
    minInvestment: 2500, accreditedOnly: true, status: 'FUNDED',
    description: '4-unit apartment building in the Highlands. All units occupied.',
    longDescription: `This 4-unit apartment building sits in Louisville's highly desirable Highlands neighborhood, one of the city's most walkable and sought-after residential areas. The building was renovated in 2020 with a new roof, updated HVAC systems in all units, and modern interior finishes including stainless appliances and LVP flooring.\n\nAll four units are currently occupied with a 100% occupancy rate maintained over the past 36 months. The rental market in the Highlands remains extremely tight with vacancy rates below 3%, supporting continued rent growth. Current rents are at or below market, presenting upside potential at lease renewal.\n\nThe property operates on a professional property management platform with tenant screening, maintenance coordination, and automated rent collection. Investors receive monthly distributions from net rental income.`,
    features: ['4 units', '2 bed / 1 bath each', 'Built 1985', 'Renovated 2020', 'New roof & HVAC', '100% occupied'],
    highlights: [
      { icon: 'building', label: 'Units', value: '4' },
      { icon: 'sqft', label: 'Total Sq Ft', value: '4,800' },
      { icon: 'year', label: 'Renovated', value: '2020' },
      { icon: 'occupancy', label: 'Occupancy', value: '100%' },
      { icon: 'return', label: 'Proj. Return', value: '11.4%/yr' },
      { icon: 'rent', label: 'Monthly Rent', value: '$4,400' },
    ],
    yearBuilt: 1985, sqft: 4800, bedBath: '4 × 2 bed / 1 bath', occupancy: 100,
    monthlyRent: 4400, expenses: 12000, netIncome: 40800,
    neighborhood: 'Highlands, Louisville KY',
    walkScore: 91, transitScore: 74,
    documents: [
      { name: 'Property Appraisal', type: 'PDF' },
      { name: 'Rent Roll', type: 'PDF' },
      { name: 'Renovation Records', type: 'PDF' },
      { name: 'Environmental Report', type: 'PDF' },
    ],
    risks: [
      'Multi-family properties have higher management complexity',
      'One or more units may become vacant',
      'Renovation costs may arise despite recent updates',
      'Louisville rental market subject to local economic shifts',
    ],
    updates: [
      { date: 'Feb 2026', text: 'Offering fully funded. Monthly distributions began March 1.' },
      { date: 'Dec 2025', text: 'Unit 3 renewed lease, 5% rent increase applied.' },
      { date: 'Sep 2025', text: 'All units inspected. No material issues identified.' },
    ],
  },
  '3': {
    id: '3',
    address: '567 Tech Park Blvd', city: 'Indianapolis', state: 'IN', zip: '46240',
    type: 'Commercial Office',
    estimatedValue: 890000, targetRaise: 600000, raisedAmount: 89000,
    sharePrice: 5000, totalShares: 120, projectedReturn: 8.8, annualRent: 78000,
    minInvestment: 5000, accreditedOnly: true, status: 'ACTIVE',
    description: 'Office building in Keystone at the Crossing, Indianapolis\' premier business district.',
    longDescription: `Located in Indianapolis' prestigious Keystone at the Crossing business district, this 12,000 sq ft professional office building offers investors exposure to commercial real estate with strong tenant covenants. The building is anchored by three established tenants on long-term NNN leases ranging from 5–7 years, providing predictable income with minimal landlord expense obligations.\n\nThe property is currently 85% occupied, with one suite of approximately 1,800 sq ft actively marketed. The NNN lease structure means tenants pay property taxes, insurance, and maintenance directly, significantly reducing investor risk and expense volatility.\n\nIndianapolis' tech and professional services sector continues to expand, with Keystone at the Crossing remaining one of the most sought-after business addresses in the metro area. The submarket vacancy rate for class B office stands at 9%, below the national average.`,
    features: ['12,000 sq ft total', '3 NNN tenants', 'Built 2001', '85% occupied', '5–7 yr leases', 'Ample parking'],
    highlights: [
      { icon: 'building', label: 'Sq Footage', value: '12,000' },
      { icon: 'year', label: 'Year Built', value: '2001' },
      { icon: 'occupancy', label: 'Occupancy', value: '85%' },
      { icon: 'return', label: 'Proj. Return', value: '8.8%/yr' },
      { icon: 'rent', label: 'Annual Rent', value: '$78,000' },
      { icon: 'lease', label: 'Lease Type', value: 'NNN' },
    ],
    yearBuilt: 2001, sqft: 12000, bedBath: 'Commercial office', occupancy: 85,
    monthlyRent: 6500, expenses: 0, netIncome: 78000,
    neighborhood: 'Keystone at the Crossing, Indianapolis IN',
    walkScore: 55, transitScore: 38,
    documents: [
      { name: 'Property Appraisal', type: 'PDF' },
      { name: 'Lease Abstracts', type: 'PDF' },
      { name: 'Environmental Report', type: 'PDF' },
      { name: 'Title Report', type: 'PDF' },
      { name: 'Financial Statements', type: 'PDF' },
    ],
    risks: [
      'Office demand may decline due to remote work adoption',
      'Existing vacancy may take extended time to fill',
      'Commercial lease replacement is slower than residential',
      'NNN leases shift costs to tenants but lease termination risk remains',
      'Indianapolis commercial market subject to broader economic conditions',
    ],
    updates: [
      { date: 'Mar 2026', text: 'Suite 201 (1,800 sq ft) listed with commercial broker at $18/sq ft NNN.' },
      { date: 'Jan 2026', text: 'Tenant A exercised 3-year renewal option at 4% rent increase.' },
      { date: 'Nov 2025', text: 'Offering launched with $89,000 raised in first two weeks.' },
    ],
  },
};

function PhotoGallery({ photos }: { photos: string[] }) {
  const [current, setCurrent] = useState(0);

  return (
    <div className="space-y-2">
      {/* Main image */}
      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-muted group">
        <Image
          src={photos[current]}
          alt={`Property photo ${current + 1}`}
          fill
          className="object-cover"
          unoptimized
        />
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setCurrent(c => (c - 1 + photos.length) % photos.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrent(c => (c + 1) % photos.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all ${i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {current + 1} / {photos.length}
        </div>
      </div>
      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-2">
        {photos.map((photo, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`relative aspect-video rounded-lg overflow-hidden ring-2 transition-all ${i === current ? 'ring-primary' : 'ring-transparent opacity-70 hover:opacity-100'}`}
          >
            <Image src={photo} alt={`Thumbnail ${i + 1}`} fill className="object-cover" unoptimized />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function InvestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isConnected } = useAccount();
  const [shares, setShares] = useState(1);
  const [showRisks, setShowRisks] = useState(false);
  const [kycStep, setKycStep] = useState<'browse' | 'success'>('browse');
  const [investing, setInvesting] = useState(false);

  const listing = SAMPLE_LISTINGS[id as string];
  const photos = PHOTOS[id as string] || [];

  if (!listing) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-muted-foreground">Property not found.</p>
        <Button asChild variant="outline"><Link href="/invest"><ArrowLeft className="h-4 w-4 mr-2" />Back to listings</Link></Button>
      </div>
    );
  }

  const pct = Math.round((listing.raisedAmount / listing.targetRaise) * 100);
  const sharesLeft = listing.totalShares - Math.round(listing.raisedAmount / listing.sharePrice);
  const investmentTotal = shares * listing.sharePrice;
  const ownershipPct = ((shares / listing.totalShares) * 100).toFixed(2);
  const annualIncome = (shares / listing.totalShares) * listing.netIncome;
  const monthlyIncome = annualIncome / 12;

  async function handleInvest() {
    if (!isConnected) { router.push('/onboarding'); return; }
    setInvesting(true);
    await new Promise(r => setTimeout(r, 1500));
    setKycStep('success');
    setInvesting(false);
  }

  if (kycStep === 'success') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Investment Submitted!</h2>
        <p className="text-muted-foreground">
          Your investment of <strong>{formatCurrency(investmentTotal)}</strong> for{' '}
          <strong>{shares} share{shares !== 1 ? 's' : ''}</strong> in{' '}
          <strong>{listing.address}, {listing.city}</strong> has been submitted.
        </p>
        <Card className="text-left">
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shares purchased</span><span className="font-medium">{shares}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ownership stake</span><span className="font-medium">{ownershipPct}%</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Est. monthly income</span><span className="font-medium text-green-600">{formatCurrency(monthlyIncome)}/mo</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Est. annual income</span><span className="font-medium text-green-600">{formatCurrency(annualIncome)}/yr</span></div>
          </CardContent>
        </Card>
        <p className="text-sm text-muted-foreground">You'll receive an email confirmation. Monthly distributions begin once the offering closes.</p>
        <div className="flex gap-3 justify-center">
          <Button asChild><Link href="/account">View in Account</Link></Button>
          <Button asChild variant="outline"><Link href="/invest">Browse More</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/invest"><ArrowLeft className="h-4 w-4 mr-1" />Back to listings</Link>
      </Button>

      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant={listing.status === 'FUNDED' ? 'success' : 'info'}>
              {listing.status === 'FUNDED' ? 'Fully Funded' : 'Open for Investment'}
            </Badge>
            <Badge variant="secondary">{listing.type}</Badge>
            {listing.accreditedOnly && <Badge variant="outline">Accredited investors only</Badge>}
          </div>
          <h1 className="text-2xl font-bold">{listing.address}</h1>
          <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3.5 w-3.5" />{listing.city}, {listing.state} {listing.zip}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold text-primary">{listing.projectedReturn}%</p>
          <p className="text-xs text-muted-foreground">projected annual return</p>
        </div>
      </div>

      {/* Photo gallery */}
      {photos.length > 0 && <PhotoGallery photos={photos} />}

      {/* Quick stat strip */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {listing.highlights.map(({ label, value }) => (
          <div key={label} className="bg-muted/40 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-bold text-sm mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — details */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">About This Property</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {listing.longDescription.split('\n\n').map((para, i) => (
                    <p key={i} className="text-sm text-muted-foreground leading-relaxed">{para}</p>
                  ))}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {listing.features.map(f => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />Location & Neighborhood</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{listing.neighborhood}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">Walk Score</span>
                        <span className="text-muted-foreground">{listing.walkScore}/100</span>
                      </div>
                      <Progress value={listing.walkScore} className="h-2" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">Transit Score</span>
                        <span className="text-muted-foreground">{listing.transitScore}/100</span>
                      </div>
                      <Progress value={listing.transitScore} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risks */}
              <Card className="border-amber-200">
                <CardContent className="pt-4">
                  <button className="w-full flex items-center justify-between text-left" onClick={() => setShowRisks(!showRisks)}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-sm">Risk Disclosure</span>
                    </div>
                    {showRisks ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {showRisks && (
                    <ul className="mt-3 space-y-2">
                      {listing.risks.map(risk => (
                        <li key={risk} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-amber-500 shrink-0 mt-0.5">•</span>{risk}
                        </li>
                      ))}
                      <li className="text-xs text-muted-foreground mt-2 border-t pt-2">
                        All investments involve risk. Past performance does not guarantee future results. This is not investment advice. Consult a financial advisor.
                      </li>
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* FINANCIALS */}
            <TabsContent value="financials" className="space-y-4 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Income Statement (Annual)</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {[
                      { label: 'Gross Rental Income', value: formatCurrency(listing.annualRent), positive: true },
                      { label: 'Operating Expenses', value: listing.expenses > 0 ? `(${formatCurrency(listing.expenses)})` : 'Tenant-paid (NNN)', negative: listing.expenses > 0 },
                      { label: 'Net Operating Income', value: formatCurrency(listing.netIncome), bold: true, highlight: true },
                    ].map(({ label, value, positive, negative, bold, highlight }) => (
                      <div key={label} className={`flex justify-between py-2 ${bold ? 'border-t font-semibold' : ''}`}>
                        <span className={`text-sm ${negative ? 'text-muted-foreground' : ''}`}>{label}</span>
                        <span className={`text-sm ${highlight ? 'text-primary font-bold' : negative ? 'text-red-500' : ''}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Offering Details</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'Estimated Property Value', value: formatCurrency(listing.estimatedValue) },
                      { label: 'Total Raise Target', value: formatCurrency(listing.targetRaise) },
                      { label: 'Share Price', value: formatCurrency(listing.sharePrice) },
                      { label: 'Total Shares', value: listing.totalShares.toString() },
                      { label: 'Shares Remaining', value: listing.status === 'FUNDED' ? 'None (fully funded)' : `${sharesLeft} of ${listing.totalShares}` },
                      { label: 'Minimum Investment', value: formatCurrency(listing.minInvestment) },
                      { label: 'Projected Annual Return', value: `${listing.projectedReturn}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm py-1 border-b border-muted last:border-0">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(listing.raisedAmount)} raised ({pct}%)</span>
                      <span>Goal: {formatCurrency(listing.targetRaise)}</span>
                    </div>
                    <Progress value={pct} className="h-2.5" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DOCUMENTS */}
            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Due Diligence Documents</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-2">
                    {listing.documents.map(doc => (
                      <button key={doc.name} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 text-left transition-colors">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.type} · Click to view</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Shield className="h-3 w-3" /> Documents verified and stored on IPFS for permanent access
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* UPDATES */}
            <TabsContent value="updates" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Property Updates</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {listing.updates.map((update, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1 shrink-0" />
                          {i < listing.updates.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-xs text-muted-foreground font-medium">{update.date}</p>
                          <p className="text-sm mt-0.5">{update.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right — invest widget */}
        <div className="space-y-4">
          <Card className="sticky top-20">
            <CardHeader><CardTitle className="text-base">Calculate Your Investment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {listing.status === 'FUNDED' ? (
                <div className="text-center py-4 space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                  <p className="font-medium">This offering is fully funded</p>
                  <p className="text-sm text-muted-foreground">All shares have been sold. Monthly distributions are active.</p>
                  <Button asChild variant="outline" className="w-full"><Link href="/invest">Browse other properties</Link></Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of shares</label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setShares(s => Math.max(1, s - 1))}>−</Button>
                      <Input type="number" min={1} max={sharesLeft} value={shares}
                        onChange={e => setShares(Math.min(sharesLeft, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="text-center" />
                      <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setShares(s => Math.min(sharesLeft, s + 1))}>+</Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{formatCurrency(listing.sharePrice)} per share · {sharesLeft} available</p>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total investment</span><span className="font-semibold">{formatCurrency(investmentTotal)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Ownership stake</span><span className="font-semibold">{ownershipPct}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Est. monthly income</span><span className="font-semibold text-green-600">{formatCurrency(monthlyIncome)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Est. annual income</span><span className="font-semibold text-green-600">{formatCurrency(annualIncome)}</span></div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 space-y-1">
                    <p className="font-medium flex items-center gap-1"><Info className="h-3 w-3" />What happens next</p>
                    <p>1. Your investment is reserved on-chain</p>
                    <p>2. KYC identity check (required by law)</p>
                    <p>3. Funds held in smart contract escrow</p>
                    <p>4. Monthly distributions once offering closes</p>
                  </div>

                  {!isConnected ? (
                    <div className="space-y-2">
                      <Button className="w-full" asChild>
                        <Link href="/auth/signup?redirect=/invest/{listing.id}">Create Account to Invest</Link>
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">Free to join · No crypto knowledge needed</p>
                    </div>
                  ) : (
                    <Button className="w-full" onClick={handleInvest} loading={investing}>
                      {investing ? 'Processing…' : `Invest ${formatCurrency(investmentTotal)}`}
                    </Button>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    {listing.accreditedOnly ? 'Accredited investors only. ' : ''}Min: {formatCurrency(listing.minInvestment)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Share link */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground text-center">
                Questions? <a href="mailto:invest@chaindeed.io" className="text-primary hover:underline">Contact our investment team</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
