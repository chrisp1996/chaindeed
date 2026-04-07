'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import {
  ArrowLeft, MapPin, TrendingUp, Users, DollarSign, Shield,
  CheckCircle2, AlertTriangle, Building, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';

// Same sample data as the browse page — in production fetched from API
const SAMPLE_LISTINGS: Record<string, {
  id: string; address: string; type: string; estimatedValue: number;
  targetRaise: number; raisedAmount: number; sharePrice: number; totalShares: number;
  projectedReturn: number; annualRent: number; minInvestment: number;
  accreditedOnly: boolean; status: string; description: string; features: string[];
  yearBuilt: number; sqft: number; bedBath: string; occupancy: number;
  monthlyRent: number; expenses: number; netIncome: number;
  documents: { name: string; type: string }[];
  risks: string[];
}> = {
  '1': {
    id: '1', address: '789 Maple Drive, Columbus, OH 43201', type: 'Single-family rental',
    estimatedValue: 275000, targetRaise: 200000, raisedAmount: 142000,
    sharePrice: 1000, totalShares: 200, projectedReturn: 9.2, annualRent: 19200,
    minInvestment: 1000, accreditedOnly: true, status: 'ACTIVE',
    description: 'Well-maintained 3BR/2BA single-family in established Columbus neighborhood. Currently rented at $1,600/month with a strong 3-year lease in place. Property has been professionally managed since 2021.',
    features: ['3 bed / 2 bath', '1,450 sq ft', 'Built 2008', 'Currently rented'],
    yearBuilt: 2008, sqft: 1450, bedBath: '3 bed / 2 bath', occupancy: 100,
    monthlyRent: 1600, expenses: 4800, netIncome: 14400,
    documents: [
      { name: 'Property Appraisal', type: 'PDF' },
      { name: 'Lease Agreement', type: 'PDF' },
      { name: 'Inspection Report', type: 'PDF' },
      { name: 'Title Report', type: 'PDF' },
    ],
    risks: [
      'Tenant may vacate at end of lease term',
      'Property value may decrease in a down market',
      'Repairs and maintenance costs may reduce returns',
      'Liquidity is limited — shares cannot be sold instantly',
    ],
  },
  '2': {
    id: '2', address: '234 River Rd, Louisville, KY 40202', type: 'Multi-family',
    estimatedValue: 480000, targetRaise: 350000, raisedAmount: 350000,
    sharePrice: 2500, totalShares: 140, projectedReturn: 11.4, annualRent: 52800,
    minInvestment: 2500, accreditedOnly: true, status: 'FUNDED',
    description: '4-unit apartment building in the Highlands neighborhood. All units occupied with strong rental history. Building renovated in 2020 with new roof, HVAC, and updated interiors.',
    features: ['4 units', '2 bed each', 'Built 1985, renovated 2020', '100% occupied'],
    yearBuilt: 1985, sqft: 4800, bedBath: '4 × 2 bed / 1 bath', occupancy: 100,
    monthlyRent: 4400, expenses: 12000, netIncome: 40800,
    documents: [
      { name: 'Property Appraisal', type: 'PDF' },
      { name: 'Rent Roll', type: 'PDF' },
      { name: 'Renovation Records', type: 'PDF' },
    ],
    risks: [
      'Multi-family properties have higher management complexity',
      'One or more units may become vacant',
      'Renovation costs may arise despite recent updates',
    ],
  },
  '3': {
    id: '3', address: '567 Tech Park Blvd, Indianapolis, IN 46240', type: 'Commercial',
    estimatedValue: 890000, targetRaise: 600000, raisedAmount: 89000,
    sharePrice: 5000, totalShares: 120, projectedReturn: 8.8, annualRent: 78000,
    minInvestment: 5000, accreditedOnly: true, status: 'ACTIVE',
    description: 'Office building in Keystone at the Crossing, Indianapolis\' premier business district. Three anchor tenants on NNN leases ranging 5-7 years. 85% occupied with one vacancy currently marketed.',
    features: ['12,000 sq ft', '3 tenants', 'Built 2001', 'NNN leases'],
    yearBuilt: 2001, sqft: 12000, bedBath: 'Commercial office', occupancy: 85,
    monthlyRent: 6500, expenses: 0, netIncome: 78000,
    documents: [
      { name: 'Property Appraisal', type: 'PDF' },
      { name: 'Lease Abstracts', type: 'PDF' },
      { name: 'Environmental Report', type: 'PDF' },
      { name: 'Title Report', type: 'PDF' },
    ],
    risks: [
      'Office demand may decline due to remote work trends',
      'Existing vacancy may take time to fill',
      'Commercial leases are harder to replace than residential',
      'NNN leases shift some costs to tenants but not all',
    ],
  },
};

export default function InvestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isConnected } = useAccount();
  const [shares, setShares] = useState(1);
  const [showRisks, setShowRisks] = useState(false);
  const [kycStep, setKycStep] = useState<'browse' | 'kyc' | 'confirm' | 'success'>('browse');
  const [investing, setInvesting] = useState(false);

  const listing = SAMPLE_LISTINGS[id as string];

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
  const annualIncome = ((shares / listing.totalShares) * listing.netIncome);
  const monthlyIncome = annualIncome / 12;

  async function handleInvest() {
    if (!isConnected) { router.push('/onboarding'); return; }
    setInvesting(true);
    await new Promise(r => setTimeout(r, 1500)); // simulate API call
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
          <strong>{listing.address}</strong> has been submitted.
        </p>
        <Card className="text-left">
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shares purchased</span><span className="font-medium">{shares}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ownership stake</span><span className="font-medium">{ownershipPct}%</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Est. monthly income</span><span className="font-medium text-green-600">{formatCurrency(monthlyIncome)}/mo</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Est. annual income</span><span className="font-medium text-green-600">{formatCurrency(annualIncome)}/yr</span></div>
          </CardContent>
        </Card>
        <p className="text-sm text-muted-foreground">You'll receive an email confirmation and distribution payments will begin once the offering closes.</p>
        <div className="flex gap-3 justify-center">
          <Button asChild><Link href="/dashboard">Go to Dashboard</Link></Button>
          <Button asChild variant="outline"><Link href="/invest">Browse More</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/invest"><ArrowLeft className="h-4 w-4 mr-1" />Back to listings</Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{listing.address}</h1>
            <Badge variant={listing.status === 'FUNDED' ? 'success' : 'info'}>
              {listing.status === 'FUNDED' ? 'Fully Funded' : 'Open for Investment'}
            </Badge>
            {listing.accreditedOnly && <Badge variant="outline">Accredited investors only</Badge>}
          </div>
          <p className="text-muted-foreground mt-1">{listing.type}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold text-primary">{listing.projectedReturn}%</p>
          <p className="text-xs text-muted-foreground">projected annual return</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Property info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Property Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Type', value: listing.type },
                  { label: 'Built', value: listing.yearBuilt },
                  { label: 'Size', value: `${listing.sqft.toLocaleString()} sq ft` },
                  { label: 'Occupancy', value: `${listing.occupancy}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/40 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold text-sm mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {listing.features.map(f => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
              </div>
            </CardContent>
          </Card>

          {/* Financials */}
          <Card>
            <CardHeader><CardTitle className="text-base">Financial Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Property Value', value: formatCurrency(listing.estimatedValue) },
                  { label: 'Annual Gross Rent', value: formatCurrency(listing.annualRent) },
                  { label: 'Annual Expenses', value: formatCurrency(listing.expenses), note: listing.type === 'Commercial' ? 'Tenant-paid (NNN)' : 'Mgmt, tax, insurance' },
                  { label: 'Net Annual Income', value: formatCurrency(listing.netIncome), highlight: true },
                  { label: 'Total Raise Target', value: formatCurrency(listing.targetRaise) },
                  { label: 'Amount Raised', value: `${formatCurrency(listing.raisedAmount)} (${pct}%)`, highlight: pct === 100 },
                ].map(({ label, value, note, highlight }) => (
                  <div key={label} className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`font-semibold ${highlight ? 'text-primary' : ''}`}>{value}</p>
                    {note && <p className="text-xs text-muted-foreground">{note}</p>}
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(listing.raisedAmount)} raised</span>
                  <span>Goal: {formatCurrency(listing.targetRaise)}</span>
                </div>
                <Progress value={pct} className="h-2" />
                <p className="text-xs text-muted-foreground">{sharesLeft} of {listing.totalShares} shares remaining</p>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader><CardTitle className="text-base">Due Diligence Documents</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-2">
                {listing.documents.map(doc => (
                  <button key={doc.name} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 text-left transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 shrink-0">
                      <span className="text-xs font-bold text-primary">{doc.type}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">Click to view</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Documents verified and stored on IPFS
              </p>
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
                    All investments involve risk. Past performance does not guarantee future results. This is not investment advice. Consult a financial advisor before investing.
                  </li>
                </ul>
              )}
            </CardContent>
          </Card>
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
                  <p className="text-sm text-muted-foreground">All shares have been sold.</p>
                  <Button asChild variant="outline" className="w-full"><Link href="/invest">Browse other properties</Link></Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of shares</label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-9 w-9 shrink-0"
                        onClick={() => setShares(s => Math.max(1, s - 1))}>−</Button>
                      <Input type="number" min={1} max={sharesLeft} value={shares}
                        onChange={e => setShares(Math.min(sharesLeft, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="text-center" />
                      <Button variant="outline" size="icon" className="h-9 w-9 shrink-0"
                        onClick={() => setShares(s => Math.min(sharesLeft, s + 1))}>+</Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{formatCurrency(listing.sharePrice)} per share · {sharesLeft} shares available</p>
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
                    <p>1. Your investment is reserved</p>
                    <p>2. KYC identity check (required by law)</p>
                    <p>3. Funds held in smart contract escrow</p>
                    <p>4. Monthly distributions once offering closes</p>
                  </div>

                  {!isConnected ? (
                    <div className="space-y-2">
                      <Button className="w-full" asChild>
                        <Link href="/onboarding">Connect Account to Invest</Link>
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">Free to create · No crypto knowledge needed</p>
                    </div>
                  ) : (
                    <Button className="w-full" onClick={handleInvest} loading={investing}>
                      {investing ? 'Processing...' : `Invest ${formatCurrency(investmentTotal)}`}
                    </Button>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    {listing.accreditedOnly ? '⚠️ Accredited investors only. ' : ''}
                    Minimum investment: {formatCurrency(listing.minInvestment)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
