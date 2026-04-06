'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Search, MapPin, Home, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { WizardProgress } from '@/components/wizard/WizardProgress';
import { FieldWithHelp } from '@/components/wizard/FieldWithHelp';
import { PlainEnglishSummary } from '@/components/wizard/PlainEnglishSummary';
import { WhatYouNeed } from '@/components/wizard/WhatYouNeed';
import { formatCurrency, calculateTransferTax, stateAbbrevToName } from '@/lib/utils';
import { STATE_CONFIGS, isStateSupported } from '@/config/stateLaws';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, name: 'Property details' },
  { id: 2, name: 'Verify ownership' },
  { id: 3, name: 'Parties involved' },
  { id: 4, name: 'Terms & price' },
  { id: 5, name: 'State requirements' },
  { id: 6, name: 'Upload documents' },
  { id: 7, name: 'Review everything' },
  { id: 8, name: 'Finalize' },
];

const SUPPORTED = ['OH', 'KY', 'IN'];
const US_STATES = [
  { value: 'OH', label: 'Ohio' }, { value: 'KY', label: 'Kentucky' }, { value: 'IN', label: 'Indiana' },
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'ID', label: 'Idaho' }, { value: 'IL', label: 'Illinois' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OK', label: 'Oklahoma' }, { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' }, { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' }, { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

interface FormData {
  streetAddress: string; city: string; state: string; zipCode: string; county: string;
  apn: string; propertyType: string; yearBuilt: string;
  ownershipVerified: boolean; currentOwnerName: string;
  buyerName: string; buyerEmail: string; buyerWallet: string;
  sellerName: string; sellerEmail: string; sellerWallet: string;
  titleCompany: string; arbiterEmail: string;
  purchasePrice: string; earnestMoney: string; financingType: string;
  inspectionDeadline: string; financingDeadline: string; closingDate: string;
  inspectionContingency: boolean; financingContingency: boolean; appraisalContingency: boolean;
  disclosureUploaded: boolean; salesDisclosureUploaded: boolean;
  leadPaintDisclosure: boolean; yearBuiltBefore1978: boolean;
}

export default function RealEstatePurchasePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);
  const [data, setData] = useState<FormData>({
    streetAddress: '', city: '', state: '', zipCode: '', county: '', apn: '', propertyType: 'residential', yearBuilt: '',
    ownershipVerified: false, currentOwnerName: '',
    buyerName: '', buyerEmail: '', buyerWallet: '', sellerName: '', sellerEmail: '', sellerWallet: '',
    titleCompany: '', arbiterEmail: '',
    purchasePrice: '', earnestMoney: '', financingType: 'conventional',
    inspectionDeadline: '', financingDeadline: '', closingDate: '',
    inspectionContingency: true, financingContingency: true, appraisalContingency: true,
    disclosureUploaded: false, salesDisclosureUploaded: false,
    leadPaintDisclosure: false, yearBuiltBefore1978: false,
  });

  const update = (field: keyof FormData, value: any) => setData(prev => ({ ...prev, [field]: value }));

  const price = parseFloat(data.purchasePrice) || 0;
  const earnest = parseFloat(data.earnestMoney) || 0;
  const stateConfig = data.state && isStateSupported(data.state) ? STATE_CONFIGS[data.state as 'OH' | 'KY' | 'IN'] : null;
  const transferTax = price > 0 && data.state ? calculateTransferTax(price, data.state) : null;

  const handlePropertyLookup = async () => {
    if (!data.streetAddress || !data.state) { toast.error('Enter an address and state first'); return; }
    setLookupLoading(true);
    try {
      const res = await fetch(`/api/properties?address=${encodeURIComponent(data.streetAddress)}&state=${data.state}`);
      const prop = await res.json();
      if (prop.found) {
        update('county', prop.county || '');
        update('currentOwnerName', prop.currentOwnerName || '');
        toast.success('Property found! Owner information loaded.');
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'REAL_ESTATE_PURCHASE', state: data.state,
          purchasePrice: price, earnestMoneyAmount: earnest,
          closingDate: data.closingDate ? new Date(data.closingDate) : null,
          wizardData: data,
        }),
      });
      const contract = await res.json();
      setContractId(contract.id);
      toast.success('Purchase agreement created! Both parties will receive email invitations.');
      setStep(8);
    } catch {
      toast.error('Failed to create agreement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStateComing = data.state && !SUPPORTED.includes(data.state);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <WizardProgress steps={STEPS} currentStep={step} estimatedMinutesRemaining={Math.max(2, (STEPS.length - step) * 4)} />

      {/* Step 1: Property Details */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">Tell us about the property</h1>
            <p className="text-muted-foreground mt-1">We'll use this to look up ownership records and apply the correct state laws.</p>
          </div>
          <WhatYouNeed items={[
            { id: 'addr', category: 'property', label: 'Full property address', description: 'Including street, city, state, and ZIP', required: true },
            { id: 'apn', category: 'document', label: 'APN (Assessor Parcel Number)', description: 'Found on your property tax bill — 13 digits', required: false },
            { id: 'parties', category: 'info', label: 'Buyer and seller contact info', description: 'Names and email addresses', required: true },
            { id: 'price', category: 'funds', label: 'Agreed purchase price', description: 'The price both parties have agreed to', required: true },
            { id: 'wallet', category: 'account', label: 'Secure account connected', required: true },
          ]} />

          <Card>
            <CardContent className="pt-6 space-y-4">
              <FieldWithHelp label="Street address" helpText="The full street address including number and street name" required htmlFor="street">
                <Input id="street" placeholder="123 Main Street" value={data.streetAddress} onChange={e => update('streetAddress', e.target.value)} />
              </FieldWithHelp>
              <div className="grid sm:grid-cols-3 gap-3">
                <FieldWithHelp label="City" helpText="City where the property is located" required htmlFor="city" className="sm:col-span-1">
                  <Input id="city" placeholder="Columbus" value={data.city} onChange={e => update('city', e.target.value)} />
                </FieldWithHelp>
                <FieldWithHelp label="State" helpText="State where the property is located. Only Ohio, Kentucky, and Indiana are fully supported." required className="sm:col-span-1">
                  <Select value={data.state} onValueChange={v => update('state', v)}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}{SUPPORTED.includes(s.value) ? ' ✓' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldWithHelp>
                <FieldWithHelp label="ZIP Code" helpText="5-digit ZIP code" required htmlFor="zip" className="sm:col-span-1">
                  <Input id="zip" placeholder="43201" maxLength={5} value={data.zipCode} onChange={e => update('zipCode', e.target.value)} />
                </FieldWithHelp>
              </div>

              {isStateComing && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Coming Soon — {stateAbbrevToName(data.state)}</p>
                    <p className="text-sm text-amber-700 mt-1">ChainDeed currently supports Ohio, Kentucky, and Indiana with full state-law guidance. We're expanding soon.</p>
                    <a href="mailto:hello@chaindeed.io" className="text-sm text-primary hover:underline mt-1 inline-block">Contact us to request your state →</a>
                  </div>
                </div>
              )}

              <FieldWithHelp label="APN (Assessor Parcel Number)" helpText="The 13-digit number found on your property tax bill. Used to look up official county records." htmlFor="apn" example="530-00-00-001-000">
                <Input id="apn" placeholder="000-00-00-000-000" value={data.apn} onChange={e => update('apn', e.target.value)} />
              </FieldWithHelp>
              <div className="grid sm:grid-cols-2 gap-3">
                <FieldWithHelp label="Property type" helpText="What type of property is this?" required>
                  <Select value={data.propertyType} onValueChange={v => update('propertyType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Single-family home</SelectItem>
                      <SelectItem value="condo">Condo / Townhouse</SelectItem>
                      <SelectItem value="multi_family">Multi-family</SelectItem>
                      <SelectItem value="land">Land / Lot</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldWithHelp>
                <FieldWithHelp label="Year built" helpText="The year the home was built. Important for lead paint disclosure requirements." htmlFor="yearBuilt" example="1995">
                  <Input id="yearBuilt" type="number" placeholder="1995" value={data.yearBuilt} onChange={e => {
                    update('yearBuilt', e.target.value);
                    update('yearBuiltBefore1978', parseInt(e.target.value) < 1978);
                  }} />
                </FieldWithHelp>
              </div>
              {data.yearBuiltBefore1978 && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800"><strong>Lead Paint Disclosure Required.</strong> Homes built before 1978 require a federal lead-based paint disclosure. We'll guide you through this.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Verify Ownership */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">Verify Ownership</h1>
            <p className="text-muted-foreground mt-1">We'll look up the property in county records to confirm ownership information.</p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                <p className="font-semibold text-blue-900 flex items-center gap-2"><MapPin className="h-4 w-4" />Looking up: {data.streetAddress}, {data.city}, {data.state} {data.zipCode}</p>
              </div>
              <Button variant="outline" className="w-full gap-2" onClick={handlePropertyLookup} loading={lookupLoading}>
                <Search className="h-4 w-4" />Look Up Property Records
              </Button>
              {data.currentOwnerName && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" /><p className="font-semibold text-green-800">Property Found in County Records</p></div>
                  <div className="text-sm space-y-1 text-green-700">
                    <p><strong>Owner on Record:</strong> {data.currentOwnerName}</p>
                    {data.county && <p><strong>County:</strong> {data.county}</p>}
                  </div>
                </div>
              )}
              <FieldWithHelp label="Confirm current owner's name" helpText="Confirm the seller's name matches the owner of record. If it doesn't match, contact an attorney before proceeding." required htmlFor="ownerName">
                <Input id="ownerName" placeholder="Name as it appears on the deed" value={data.currentOwnerName} onChange={e => update('currentOwnerName', e.target.value)} />
              </FieldWithHelp>
              <div className="flex items-start gap-3">
                <Checkbox id="ownerVerify" checked={data.ownershipVerified} onCheckedChange={v => update('ownershipVerified', !!v)} />
                <div>
                  <Label htmlFor="ownerVerify" className="font-medium">I confirm the seller is the legal owner of this property</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">The title search (completed later) will officially verify this.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Parties */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">Who are the parties?</h1>
            <p className="text-muted-foreground mt-1">Enter the buyer, seller, and title company information.</p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-5">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Buyer</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldWithHelp label="Buyer's full name" helpText="Legal name as it will appear on the deed" required htmlFor="buyerName">
                  <Input id="buyerName" placeholder="John Smith" value={data.buyerName} onChange={e => update('buyerName', e.target.value)} />
                </FieldWithHelp>
                <FieldWithHelp label="Buyer's email" helpText="We'll send a review link here" required htmlFor="buyerEmail">
                  <Input id="buyerEmail" type="email" placeholder="john@example.com" value={data.buyerEmail} onChange={e => update('buyerEmail', e.target.value)} />
                </FieldWithHelp>
              </div>

              <Separator />
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Seller</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldWithHelp label="Seller's full name" helpText="Legal name as it appears on the current deed" required htmlFor="sellerName">
                  <Input id="sellerName" placeholder="Jane Doe" value={data.sellerName} onChange={e => update('sellerName', e.target.value)} />
                </FieldWithHelp>
                <FieldWithHelp label="Seller's email" helpText="We'll send a review link here" required htmlFor="sellerEmail">
                  <Input id="sellerEmail" type="email" placeholder="jane@example.com" value={data.sellerEmail} onChange={e => update('sellerEmail', e.target.value)} />
                </FieldWithHelp>
              </div>

              <Separator />
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Title Company / Attorney (optional)</p>
              <FieldWithHelp label="Title company or attorney name" helpText="The title company or attorney handling closing. Required in Kentucky (attorney strongly recommended)." htmlFor="titleCompany">
                <Input id="titleCompany" placeholder="First American Title, Smith & Associates Law, etc." value={data.titleCompany} onChange={e => update('titleCompany', e.target.value)} />
              </FieldWithHelp>
              {stateConfig?.closingType === 'attorney' && (
                <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-100 p-3">
                  <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800"><strong>Kentucky:</strong> Attorney involvement is strongly recommended for all Kentucky real estate transactions. The Kentucky Bar Association provides a directory of real estate attorneys.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Terms */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">Set the terms</h1>
            <p className="text-muted-foreground mt-1">Purchase price, earnest money, contingencies, and timeline.</p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldWithHelp label="Purchase price" helpText="The total price agreed to by buyer and seller" required htmlFor="price" example="$285,000">
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input id="price" type="number" className="pl-7" placeholder="285000" value={data.purchasePrice} onChange={e => update('purchasePrice', e.target.value)} />
                  </div>
                </FieldWithHelp>
                <FieldWithHelp label="Earnest money deposit" helpText="A good-faith deposit (typically 1-3% of purchase price) held in escrow. Applied to purchase price at closing." required htmlFor="earnest" example="$5,000 (about 1.75%)">
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input id="earnest" type="number" className="pl-7" placeholder="5000" value={data.earnestMoney} onChange={e => update('earnestMoney', e.target.value)} />
                  </div>
                </FieldWithHelp>
              </div>

              {transferTax && price > 0 && (
                <div className="rounded-lg bg-muted/50 border p-4 text-sm space-y-1">
                  <p className="font-semibold">{stateAbbrevToName(data.state)} Transfer Tax</p>
                  <p className="text-muted-foreground">{transferTax.label}</p>
                  <p>Total: <strong>{formatCurrency(transferTax.total)}</strong></p>
                  {transferTax.sellerShare > 0 && <p>Seller pays: <strong>{formatCurrency(transferTax.sellerShare)}</strong></p>}
                  {transferTax.buyerShare > 0 && <p>Buyer pays: <strong>{formatCurrency(transferTax.buyerShare)}</strong></p>}
                </div>
              )}

              <FieldWithHelp label="Financing type" helpText="How is the buyer paying? Cash sales close faster; financed sales require appraisal and lender approval." required>
                <Select value={data.financingType} onValueChange={v => update('financingType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash — no financing</SelectItem>
                    <SelectItem value="conventional">Conventional mortgage</SelectItem>
                    <SelectItem value="fha">FHA loan</SelectItem>
                    <SelectItem value="va">VA loan</SelectItem>
                    <SelectItem value="usda">USDA loan</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWithHelp>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Contingencies</p>
                <p className="text-xs text-muted-foreground">Contingencies protect you — if these conditions aren't met, you can back out and get your earnest money back.</p>
                {[
                  { id: 'inspectionContingency', field: 'inspectionContingency' as const, label: 'Inspection contingency', desc: "Buyer can back out if inspection reveals problems" },
                  { id: 'financingContingency', field: 'financingContingency' as const, label: 'Financing contingency', desc: "Buyer can back out if they can't get a loan" },
                  { id: 'appraisalContingency', field: 'appraisalContingency' as const, label: 'Appraisal contingency', desc: "Buyer can renegotiate if appraisal comes in low" },
                ].map(({ id, field, label, desc }) => (
                  <div key={id} className="flex items-start gap-3">
                    <Checkbox id={id} checked={data[field]} onCheckedChange={v => update(field, !!v)} />
                    <div><Label htmlFor={id} className="font-medium cursor-pointer">{label}</Label><p className="text-xs text-muted-foreground">{desc}</p></div>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {data.inspectionContingency && (
                  <FieldWithHelp label="Inspection deadline" helpText="How many days does the buyer have to complete their inspection?" required htmlFor="inspDeadline">
                    <Input id="inspDeadline" type="date" value={data.inspectionDeadline} onChange={e => update('inspectionDeadline', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                  </FieldWithHelp>
                )}
                {data.financingContingency && (
                  <FieldWithHelp label="Financing deadline" helpText="By when must the buyer have loan approval?" required htmlFor="finDeadline">
                    <Input id="finDeadline" type="date" value={data.financingDeadline} onChange={e => update('financingDeadline', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                  </FieldWithHelp>
                )}
                <FieldWithHelp label="Closing date" helpText="The target date for transferring ownership" required htmlFor="closingDate">
                  <Input id="closingDate" type="date" value={data.closingDate} onChange={e => update('closingDate', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </FieldWithHelp>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 5: State Requirements */}
      {step === 5 && stateConfig && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">{stateAbbrevToName(data.state)} Requirements</h1>
            <p className="text-muted-foreground mt-1">These are the legal requirements for real estate transactions in {stateAbbrevToName(data.state)}. All are automatically tracked for you.</p>
          </div>

          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-5">
              <p className="text-sm font-semibold text-blue-900 mb-3">What {stateAbbrevToName(data.state)} law requires:</p>
              <div className="space-y-2">
                {stateConfig.requiredDisclosures.filter(d => d.required).map(d => (
                  <div key={d.key} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">{d.title}</p>
                      <p className="text-xs text-blue-700">{d.legalBasis}</p>
                    </div>
                  </div>
                ))}
                {data.state === 'IN' && (
                  <div className="flex items-start gap-2 mt-2 pt-2 border-t border-blue-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-amber-800">Indiana: Sales Disclosure Form required BEFORE recording. This is a hard blocker — recording cannot happen without it.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {transferTax && price > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Transfer Tax Calculation</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Purchase price</span><span className="font-medium">{formatCurrency(price)}</span></div>
                <div className="flex justify-between"><span>{transferTax.label}</span><span className="font-semibold text-primary">{formatCurrency(transferTax.total)}</span></div>
                {transferTax.sellerShare > 0 && <div className="flex justify-between text-muted-foreground"><span>Seller's share</span><span>{formatCurrency(transferTax.sellerShare)}</span></div>}
                {transferTax.buyerShare > 0 && <div className="flex justify-between text-muted-foreground"><span>Buyer's share</span><span>{formatCurrency(transferTax.buyerShare)}</span></div>}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Required Deed Language</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stateConfig.deedTypes.slice(0, 1).map(deed => (
                  <div key={deed.key}>
                    <p className="text-sm font-medium">{deed.name} (Standard for this transaction)</p>
                    <p className="text-xs text-muted-foreground mt-1">{deed.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 5 fallback for unsupported state */}
      {step === 5 && !stateConfig && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">State Requirements</h1>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
            <p className="font-semibold">Full state law guidance coming soon for {stateAbbrevToName(data.state || '')}</p>
            <p className="text-sm text-muted-foreground">ChainDeed currently provides full legal guidance for Ohio, Kentucky, and Indiana. Contact us to request your state.</p>
            <Button variant="outline" asChild><a href="mailto:hello@chaindeed.io">Request {stateAbbrevToName(data.state || '')}</a></Button>
          </div>
        </div>
      )}

      {/* Step 6: Upload Documents */}
      {step === 6 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">Upload Documents</h1>
            <p className="text-muted-foreground mt-1">Documents are stored securely and their records are recorded permanently. Only required documents block progress.</p>
          </div>
          <div className="space-y-4">
            {[
              {
                key: 'seller_disclosure',
                required: data.state === 'OH' || data.state === 'IN',
                title: data.state === 'IN' ? "Seller's Residential Disclosure (Required in Indiana)" : "Ohio Residential Property Disclosure Form",
                desc: data.state === 'IN' ? 'Required by IC 32-21-5 before accepting an offer' : 'Required by ORC 5302.30',
                field: 'disclosureUploaded' as const,
              },
              {
                key: 'sales_disclosure',
                required: data.state === 'IN',
                title: 'Indiana Sales Disclosure Form 46021 (REQUIRED — BLOCKS RECORDING)',
                desc: 'Must be filed with County Assessor before recording. Both parties must sign.',
                field: 'salesDisclosureUploaded' as const,
              },
              {
                key: 'lead_paint',
                required: data.yearBuiltBefore1978,
                title: 'Lead-Based Paint Disclosure',
                desc: 'Required by federal law for homes built before 1978',
                field: 'leadPaintDisclosure' as const,
              },
            ].filter(d => d.required).map(doc => (
              <Card key={doc.key} className={data[doc.field] ? 'border-green-200 bg-green-50' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{doc.desc}</p>
                    </div>
                    {data[doc.field] ? (
                      <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />Uploaded</Badge>
                    ) : (
                      <Badge variant="warning">Required</Badge>
                    )}
                  </div>
                  {!data[doc.field] && (
                    <Button size="sm" variant="outline" className="mt-3 gap-2 w-full" onClick={() => { update(doc.field, true); toast.success('Document uploaded and verified on permanent record.'); }}>
                      <Upload className="h-4 w-4" />Upload {doc.title.split(' ')[0]} Document
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}

            {data.state && !['OH', 'IN'].includes(data.state) && !data.yearBuiltBefore1978 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p>No required document uploads for this transaction. You can proceed.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 7: Review */}
      {step === 7 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">Review Everything</h1>
            <p className="text-muted-foreground mt-1">Full plain-English summary of your purchase agreement. Review carefully.</p>
          </div>
          <PlainEnglishSummary
            title="Your Home Purchase Agreement — Plain English"
            summary={`${data.buyerName || 'The buyer'} agrees to purchase the property at ${data.streetAddress}, ${data.city}, ${data.state} from ${data.sellerName || 'the seller'} for ${formatCurrency(price)}. The buyer will deposit ${formatCurrency(earnest)} as earnest money, held securely. Closing is targeted for ${data.closingDate ? new Date(data.closingDate).toLocaleDateString() : 'the agreed date'}.${stateConfig ? ` ${stateAbbrevToName(data.state)} state law applies.` : ''}`}
            items={[
              { label: 'Property', value: `${data.streetAddress}, ${data.city}, ${data.state} ${data.zipCode}` },
              { label: 'Purchase price', value: formatCurrency(price), highlight: true },
              { label: 'Earnest money', value: formatCurrency(earnest) },
              { label: 'Buyer', value: `${data.buyerName} (${data.buyerEmail})` },
              { label: 'Seller', value: `${data.sellerName} (${data.sellerEmail})` },
              { label: 'Financing', value: { cash: 'Cash', conventional: 'Conventional mortgage', fha: 'FHA loan', va: 'VA loan', usda: 'USDA loan' }[data.financingType] || data.financingType },
              { label: 'Closing date', value: data.closingDate ? new Date(data.closingDate).toLocaleDateString() : 'TBD' },
              ...(transferTax && price > 0 ? [{ label: 'Transfer tax', value: `${formatCurrency(transferTax.total)} (${transferTax.label})` }] : []),
            ]}
            fees={[
              { label: 'Purchase price', amount: price, paidBy: 'buyer' },
              ...(earnest > 0 ? [{ label: 'Earnest money (credited at closing)', amount: earnest, paidBy: 'buyer' as const, note: 'Applied to purchase price at closing' }] : []),
              ...(transferTax && transferTax.buyerShare > 0 ? [{ label: 'Transfer tax (your share)', amount: transferTax.buyerShare, paidBy: 'buyer' as const }] : []),
              ...(transferTax && transferTax.sellerShare > 0 ? [{ label: 'Transfer tax (seller\'s share)', amount: transferTax.sellerShare, paidBy: 'seller' as const }] : []),
              { label: 'Network processing fee', amount: 0.03, paidBy: 'buyer', note: '≈$0.03 total for all agreement actions' },
            ]}
            warnings={[
              ...(data.state === 'IN' ? ['Indiana: The Sales Disclosure Form must be filed with the County Assessor BEFORE the deed can be recorded. This is a hard legal requirement unique to Indiana.'] : []),
              ...(data.yearBuiltBefore1978 ? ['This home was built before 1978. A federal lead-based paint disclosure is required.'] : []),
              ...(!data.titleCompany && data.state === 'KY' ? ['Kentucky: Attorney involvement is strongly recommended for real estate closings.'] : []),
            ]}
            whatHappensNext={[
              { step: 'Both parties receive email links to review and digitally confirm', timeline: 'Within minutes' },
              { step: 'Buyer deposits earnest money into secure hold', timeline: 'After both parties confirm' },
              { step: 'Complete inspection, title search, and state-required steps', timeline: 'Per your deadlines' },
              { step: 'Deed prepared, signed, and recorded at county recorder', timeline: 'Before closing date' },
              { step: 'Funds released and ownership transfers', timeline: 'At closing' },
            ]}
            state={data.state}
          />
        </div>
      )}

      {/* Step 8: Finalize */}
      {step === 8 && (
        <div className="space-y-6 animate-fade-in">
          {!contractId ? (
            <>
              <div>
                <h1 className="text-2xl font-bold">Ready to Finalize</h1>
                <p className="text-muted-foreground mt-1">Creating your agreement will send invitations to both parties and begin the formal process.</p>
              </div>
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2 text-sm">
                    {[
                      `${data.streetAddress}, ${data.city}, ${data.state}`,
                      `Purchase price: ${formatCurrency(price)}`,
                      `Earnest money: ${formatCurrency(earnest)} (held securely)`,
                      `Buyer: ${data.buyerEmail}`,
                      `Seller: ${data.sellerEmail}`,
                      ...(stateConfig ? [`${stateAbbrevToName(data.state)} state law applied`] : []),
                    ].map((line, i) => (
                      <div key={i} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /><span>{line}</span></div>
                    ))}
                  </div>
                  <Button size="lg" className="w-full" onClick={handleCreate} loading={loading}>
                    Create Purchase Agreement
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">No charge until funds are deposited. Network fee ≈$0.03 total.</p>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100"><CheckCircle2 className="h-6 w-6 text-green-600" /></div>
                <div><h1 className="text-2xl font-bold">Agreement Created!</h1><p className="text-muted-foreground">Invitations sent to both parties</p></div>
              </div>
              <div className="flex gap-3">
                <Button asChild className="flex-1"><a href={`/contracts/${contractId}`}>Open Action Center <ArrowRight className="h-4 w-4" /></a></Button>
                <Button variant="outline" asChild><a href="/dashboard">Dashboard</a></Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Navigation */}
      {step < 8 && !(step === 8 && contractId) && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          {step < 7 && (
            <Button onClick={() => setStep(s => s + 1)} disabled={!!(isStateComing && step >= 1)}>
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          {step === 7 && (
            <Button onClick={() => setStep(8)}>
              Finalize Agreement <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
