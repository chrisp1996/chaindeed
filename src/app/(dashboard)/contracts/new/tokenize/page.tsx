'use client';

import { useState } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle2, TrendingUp, DollarSign, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { WizardProgress } from '@/components/wizard/WizardProgress';
import { FieldWithHelp } from '@/components/wizard/FieldWithHelp';
import { PlainEnglishSummary } from '@/components/wizard/PlainEnglishSummary';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

const STEPS = [
  { id: 1, name: 'About the property' },
  { id: 2, name: 'Verify ownership' },
  { id: 3, name: 'Investment structure' },
  { id: 4, name: 'Investor requirements' },
  { id: 5, name: 'Legal review' },
  { id: 6, name: 'Launch offering' },
];

interface FormData {
  propertyAddress: string; city: string; state: string; propertyType: string;
  description: string; estimatedValue: string; annualRent: string;
  totalShares: string; sharePrice: string; minimumInvestment: string;
  targetCloseDate: string; projectedReturn: string;
  accreditedOnly: boolean; maxInvestors: string;
  ownerConfirmed: boolean; legalReviewed: boolean;
}

export default function TokenizePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [data, setData] = useState<FormData>({
    propertyAddress: '', city: '', state: '', propertyType: 'residential',
    description: '', estimatedValue: '', annualRent: '',
    totalShares: '100', sharePrice: '', minimumInvestment: '',
    targetCloseDate: '', projectedReturn: '',
    accreditedOnly: true, maxInvestors: '',
    ownerConfirmed: false, legalReviewed: false,
  });

  const update = (field: keyof FormData, value: any) => setData(prev => ({ ...prev, [field]: value }));
  const totalShares = parseInt(data.totalShares) || 100;
  const sharePrice = parseFloat(data.sharePrice) || 0;
  const targetAmount = totalShares * sharePrice;
  const projectedAnnualReturn = parseFloat(data.projectedReturn) || 0;

  const handleLaunch = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500)); // Simulate deployment
    setLaunched(true);
    toast.success('Investment offering launched!');
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <WizardProgress steps={STEPS} currentStep={step} estimatedMinutesRemaining={Math.max(2, (STEPS.length - step) * 5)} />

      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div><h1 className="text-2xl font-bold">About the Property</h1><p className="text-muted-foreground mt-1">Tell investors about the property you're offering.</p></div>
          <Card><CardContent className="pt-6 space-y-4">
            <FieldWithHelp label="Property address" helpText="Full address of the property being tokenized" required htmlFor="addr">
              <Input id="addr" placeholder="456 Oak Ave, Indianapolis, IN 46201" value={data.propertyAddress} onChange={e => update('propertyAddress', e.target.value)} />
            </FieldWithHelp>
            <FieldWithHelp label="Property type" helpText="What type of property is this?" required>
              <Select value={data.propertyType} onValueChange={v => update('propertyType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Single-family rental</SelectItem>
                  <SelectItem value="multi_family">Multi-family</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial / Warehouse</SelectItem>
                </SelectContent>
              </Select>
            </FieldWithHelp>
            <FieldWithHelp label="Description for investors" helpText="Write a compelling description. Include property condition, location benefits, rental history." required htmlFor="desc">
              <Textarea id="desc" placeholder="3-bed, 2-bath single-family home in desirable Fountain Square neighborhood. Currently rented at $1,800/month. Built 2005, recently renovated kitchen..." rows={4} value={data.description} onChange={e => update('description', e.target.value)} />
            </FieldWithHelp>
            <div className="grid sm:grid-cols-2 gap-4">
              <FieldWithHelp label="Estimated property value" helpText="Current market value (get an appraisal for accuracy)" required htmlFor="estVal">
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input id="estVal" type="number" className="pl-7" placeholder="250000" value={data.estimatedValue} onChange={e => update('estimatedValue', e.target.value)} />
                </div>
              </FieldWithHelp>
              <FieldWithHelp label="Annual rental income" helpText="Current or projected gross rental income per year" htmlFor="rent">
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input id="rent" type="number" className="pl-7" placeholder="21600" value={data.annualRent} onChange={e => update('annualRent', e.target.value)} />
                </div>
              </FieldWithHelp>
            </div>
          </CardContent></Card>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div><h1 className="text-2xl font-bold">Verify You Own the Property</h1><p className="text-muted-foreground mt-1">Investors need assurance that you have the right to offer this property for investment.</p></div>
          <Card><CardContent className="pt-6 space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="font-semibold text-amber-900">Important: Ownership Verification</p>
              <p className="text-sm text-amber-800">Before launching an investment offering, you must:</p>
              <ol className="text-sm text-amber-800 space-y-1 ml-4 list-decimal">
                <li>Own the property free and clear, or have authorization from all owners</li>
                <li>Not have any undisclosed liens or encumbrances</li>
                <li>Comply with your state's securities laws for investment offerings</li>
                <li>Consult with a real estate attorney before launching</li>
              </ol>
            </div>
            <div className="space-y-3">
              {[
                { field: 'ownerConfirmed' as const, label: 'I confirm I am the legal owner of this property (or have written authorization from all owners)', id: 'ownerConfirm' },
                { field: 'legalReviewed' as const, label: 'I have consulted with a real estate attorney about offering investment shares in this property', id: 'legalReview' },
              ].map(({ field, label, id }) => (
                <div key={id} className="flex items-start gap-3">
                  <Checkbox id={id} checked={data[field]} onCheckedChange={v => update(field, !!v)} />
                  <Label htmlFor={id} className="font-medium cursor-pointer leading-relaxed">{label}</Label>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div><h1 className="text-2xl font-bold">Investment Structure</h1><p className="text-muted-foreground mt-1">Define the shares, price, and timeline for your offering.</p></div>
          <Card><CardContent className="pt-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FieldWithHelp label="Total shares to offer" helpText="How many shares will you divide this property into? More shares = lower price per share = more accessible to investors." required htmlFor="shares" example="100 shares (1% each)">
                <Input id="shares" type="number" placeholder="100" value={data.totalShares} onChange={e => update('totalShares', e.target.value)} />
              </FieldWithHelp>
              <FieldWithHelp label="Price per share" helpText="How much will each share cost? Target amount = shares × price." required htmlFor="sprice" example="$2,500 per share">
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input id="sprice" type="number" className="pl-7" placeholder="2500" value={data.sharePrice} onChange={e => update('sharePrice', e.target.value)} />
                </div>
              </FieldWithHelp>
            </div>

            {targetAmount > 0 && (
              <div className="rounded-lg bg-muted/50 border p-4 grid grid-cols-3 gap-3 text-center text-sm">
                <div><p className="text-muted-foreground text-xs">Target raise</p><p className="font-bold text-lg">{formatCurrency(targetAmount)}</p></div>
                <div><p className="text-muted-foreground text-xs">Price/share</p><p className="font-bold text-lg">{formatCurrency(sharePrice)}</p></div>
                <div><p className="text-muted-foreground text-xs">Total shares</p><p className="font-bold text-lg">{totalShares.toLocaleString()}</p></div>
              </div>
            )}

            <FieldWithHelp label="Projected annual return" helpText="Estimated annual return for investors, expressed as a percentage. Be conservative and accurate." htmlFor="return" example="8.5%">
              <div className="relative">
                <Input id="return" type="number" step="0.1" placeholder="8.5" value={data.projectedReturn} onChange={e => update('projectedReturn', e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </FieldWithHelp>

            <FieldWithHelp label="Offering close date" helpText="When does the offering end? If not fully funded by this date, investors get automatic refunds." required htmlFor="closeDate">
              <Input id="closeDate" type="date" value={data.targetCloseDate} onChange={e => update('targetCloseDate', e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </FieldWithHelp>
          </CardContent></Card>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div><h1 className="text-2xl font-bold">Investor Requirements</h1><p className="text-muted-foreground mt-1">Set who can invest and minimum amounts.</p></div>
          <Card><CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-blue-900">Accredited Investor Requirement</p>
                <p className="text-sm text-blue-800 mt-1">Unless you qualify for an exemption (Regulation CF, Regulation A+), offering real estate investment shares generally requires investors to be "accredited investors" (net worth over $1M or income over $200K/year). Consult your attorney.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="accredited" checked={data.accreditedOnly} onCheckedChange={v => update('accreditedOnly', !!v)} />
              <div>
                <Label htmlFor="accredited" className="font-medium cursor-pointer">Require accredited investor verification</Label>
                <p className="text-xs text-muted-foreground">Investors must complete KYC verification and confirm accredited status</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FieldWithHelp label="Minimum investment" helpText="Minimum amount an investor must commit" required htmlFor="minInvest" example="$1,000">
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input id="minInvest" type="number" className="pl-7" placeholder="1000" value={data.minimumInvestment} onChange={e => update('minimumInvestment', e.target.value)} />
                </div>
              </FieldWithHelp>
              <FieldWithHelp label="Max number of investors" helpText="Leave blank for no limit" htmlFor="maxInv">
                <Input id="maxInv" type="number" placeholder="No limit" value={data.maxInvestors} onChange={e => update('maxInvestors', e.target.value)} />
              </FieldWithHelp>
            </div>
          </CardContent></Card>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6 animate-fade-in">
          <div><h1 className="text-2xl font-bold">Legal Review Checklist</h1><p className="text-muted-foreground mt-1">Confirm you've addressed these requirements before launching.</p></div>
          <Card>
            <CardContent className="pt-6 space-y-3">
              {[
                { label: 'Consulted a real estate or securities attorney', critical: true },
                { label: 'Verified property ownership with title search', critical: true },
                { label: 'Prepared offering documents (PPM or equivalent)', critical: true },
                { label: 'Confirmed state securities law compliance', critical: true },
                { label: 'Set up property management plan', critical: false },
                { label: 'Obtained current property appraisal', critical: false },
                { label: 'Reviewed tax implications with a CPA', critical: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <Checkbox id={`legal${i}`} />
                  <Label htmlFor={`legal${i}`} className="cursor-pointer">{item.label}</Label>
                  {item.critical && <Badge variant="warning" className="ml-auto">Required</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800"><strong>⚠️ ChainDeed is not a licensed securities broker or investment advisor.</strong> This platform provides technical infrastructure only. All investment offerings must comply with applicable federal and state securities laws. Failure to comply can result in serious legal penalties.</p>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-6 animate-fade-in">
          {!launched ? (
            <>
              <div><h1 className="text-2xl font-bold">Launch Your Offering</h1><p className="text-muted-foreground mt-1">Ready to publish your investment offering.</p></div>
              <PlainEnglishSummary
                title="Investment Offering Summary"
                summary={`You are offering ${totalShares} shares of ${data.propertyAddress || 'your property'} at ${formatCurrency(sharePrice)} per share, targeting ${formatCurrency(targetAmount)} total. Investors will receive pro-rata rental income distributions. If the target isn't reached by ${data.targetCloseDate || 'the deadline'}, all investors get automatic refunds.`}
                items={[
                  { label: 'Property', value: data.propertyAddress || '—' },
                  { label: 'Total shares', value: totalShares.toLocaleString() },
                  { label: 'Price per share', value: formatCurrency(sharePrice), highlight: true },
                  { label: 'Target raise', value: formatCurrency(targetAmount), highlight: true },
                  { label: 'Projected return', value: projectedAnnualReturn ? `${projectedAnnualReturn}% annually` : '—' },
                  { label: 'Minimum investment', value: data.minimumInvestment ? formatCurrency(parseFloat(data.minimumInvestment)) : '—' },
                  { label: 'Accredited only', value: data.accreditedOnly ? 'Yes' : 'No' },
                ]}
                warnings={['All investors must complete identity verification before investing', 'This offering is for informational purposes. Consult legal counsel before proceeding.']}
                whatHappensNext={[
                  { step: 'Investment smart contract deployed on Polygon network', timeline: 'Immediately' },
                  { step: 'Offering published on ChainDeed marketplace', timeline: 'Within minutes' },
                  { step: 'Investors browse, verify identity, and invest', timeline: 'During offering period' },
                  { step: 'If target reached, purchase completes automatically', timeline: 'On close date' },
                  { step: 'Rental income distributed to shareholders monthly', timeline: 'Ongoing' },
                ]}
              />
              <Button size="lg" className="w-full" onClick={handleLaunch} loading={loading}>
                <TrendingUp className="h-4 w-4 mr-2" />Deploy & Launch Offering
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100"><CheckCircle2 className="h-6 w-6 text-green-600" /></div>
                <div><h1 className="text-2xl font-bold">Offering Launched!</h1><p className="text-muted-foreground">Your property is now listed for investment</p></div>
              </div>
              <div className="flex gap-3">
                <Button asChild className="flex-1"><Link href="/invest">View on Marketplace <ArrowRight className="h-4 w-4" /></Link></Button>
                <Button variant="outline" asChild><Link href="/dashboard">Dashboard</Link></Button>
              </div>
            </>
          )}
        </div>
      )}

      {step < 6 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
          <Button onClick={() => setStep(s => s + 1)}>Continue <ArrowRight className="h-4 w-4 ml-2" /></Button>
        </div>
      )}
    </div>
  );
}
