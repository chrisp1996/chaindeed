'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, TrendingUp, Users, DollarSign, ArrowRight, Filter, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

// Sample listings — replaced by real API data in production
const SAMPLE_LISTINGS = [
  {
    id: '1', address: '789 Maple Drive, Columbus, OH 43201', type: 'Single-family rental',
    estimatedValue: 275000, targetRaise: 200000, raisedAmount: 142000,
    sharePrice: 1000, totalShares: 200, projectedReturn: 9.2, annualRent: 19200,
    minInvestment: 1000, accreditedOnly: true, status: 'ACTIVE',
    description: 'Well-maintained 3BR/2BA single-family in established Columbus neighborhood. Currently rented at $1,600/month with 3-year lease.',
    features: ['3 bed / 2 bath', '1,450 sq ft', 'Built 2008', 'Currently rented'],
  },
  {
    id: '2', address: '234 River Rd, Louisville, KY 40202', type: 'Multi-family',
    estimatedValue: 480000, targetRaise: 350000, raisedAmount: 350000,
    sharePrice: 2500, totalShares: 140, projectedReturn: 11.4, annualRent: 52800,
    minInvestment: 2500, accreditedOnly: true, status: 'FUNDED',
    description: '4-unit apartment building in Highlands neighborhood. All units occupied. Strong rental history.',
    features: ['4 units', '2 bed each', 'Built 1985, renovated 2020', '100% occupied'],
  },
  {
    id: '3', address: '567 Tech Park Blvd, Indianapolis, IN 46240', type: 'Commercial',
    estimatedValue: 890000, targetRaise: 600000, raisedAmount: 89000,
    sharePrice: 5000, totalShares: 120, projectedReturn: 8.8, annualRent: 78000,
    minInvestment: 5000, accreditedOnly: true, status: 'ACTIVE',
    description: 'Office building in Keystone at the Crossing. 3 tenants, 85% occupied. 5-year leases.',
    features: ['12,000 sq ft', '3 tenants', 'Built 2001', 'NNN leases'],
  },
];

export default function InvestPage() {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = SAMPLE_LISTINGS.filter(l => {
    if (search && !l.address.toLowerCase().includes(search.toLowerCase())) return false;
    if (stateFilter !== 'all') {
      const state = l.address.split(', ').at(-1)?.split(' ')[0];
      if (state !== stateFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Invest in Real Estate</h1>
        <p className="text-muted-foreground mt-1">Browse fractional investment opportunities. Start with as little as $1,000.</p>
      </div>

      {/* How it works banner */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Search, title: 'Browse properties', desc: 'Review financials, location, and documents' },
          { icon: CheckCircle2, title: 'Verify identity', desc: 'Quick KYC check (required by law)' },
          { icon: TrendingUp, title: 'Invest & earn', desc: 'Receive rental income distributions monthly' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div><p className="font-medium text-sm">{title}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by address or city..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="sm:w-40"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="OH">Ohio</SelectItem>
            <SelectItem value="KY">Kentucky</SelectItem>
            <SelectItem value="IN">Indiana</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="Property type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="residential">Single-family</SelectItem>
            <SelectItem value="multi_family">Multi-family</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listings */}
      <div className="space-y-4">
        {filtered.map(listing => {
          const pct = Math.round((listing.raisedAmount / listing.targetRaise) * 100);
          return (
            <Card key={listing.id} className={listing.status === 'FUNDED' ? 'opacity-75' : 'hover:border-primary/50 hover:shadow-sm transition-all'}>
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{listing.address}</h3>
                        <Badge variant={listing.status === 'FUNDED' ? 'success' : 'info'}>{listing.status === 'FUNDED' ? 'Fully Funded' : 'Open for Investment'}</Badge>
                        {listing.accreditedOnly && <Badge variant="outline" className="text-xs">Accredited only</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{listing.type}</p>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {listing.features.map(f => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
                    </div>

                    {/* Financials */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      {[
                        { label: 'Projected return', value: `${listing.projectedReturn}%/yr`, highlight: true },
                        { label: 'Share price', value: formatCurrency(listing.sharePrice) },
                        { label: 'Min. investment', value: formatCurrency(listing.minInvestment) },
                        { label: 'Annual rent', value: formatCurrency(listing.annualRent) },
                      ].map(({ label, value, highlight }) => (
                        <div key={label}>
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className={`font-semibold ${highlight ? 'text-primary' : ''}`}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Funding progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(listing.raisedAmount)} raised ({pct}%)</span>
                        <span>Goal: {formatCurrency(listing.targetRaise)}</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  </div>

                  <div className="sm:w-36 flex-shrink-0">
                    {listing.status === 'ACTIVE' ? (
                      <Button className="w-full" asChild>
                        <Link href={`/invest/${listing.id}`}>Invest <ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>Fully Funded</Button>
                    )}
                    <p className="text-xs text-center text-muted-foreground mt-2">{listing.totalShares - Math.round(listing.raisedAmount / listing.sharePrice)} shares left</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No listings match your filters.</p>
          <Button variant="link" onClick={() => { setSearch(''); setStateFilter('all'); setTypeFilter('all'); }}>Clear filters</Button>
        </div>
      )}
    </div>
  );
}
