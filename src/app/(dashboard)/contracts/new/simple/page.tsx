'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { WizardProgress } from '@/components/wizard/WizardProgress';
import { FieldWithHelp } from '@/components/wizard/FieldWithHelp';
import { PlainEnglishSummary } from '@/components/wizard/PlainEnglishSummary';
import { WhatYouNeed } from '@/components/wizard/WhatYouNeed';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, name: 'What are you selling?' },
  { id: 2, name: "Who's involved?" },
  { id: 3, name: 'Set the terms' },
  { id: 4, name: 'Review agreement' },
  { id: 5, name: 'Confirm & create' },
  { id: 6, name: 'Track progress' },
];

interface FormData {
  assetType: string; assetDescription: string; assetValue: string;
  sellerName: string; sellerEmail: string; sellerWallet: string;
  buyerName: string; buyerEmail: string; buyerWallet: string;
  price: string; paymentMethod: string; conditions: string;
  closingDate: string; notes: string;
}

const WHAT_YOU_NEED = [
  { id: 'desc', category: 'info' as const, label: 'Description of what you\'re selling', description: 'A clear description of the asset, its condition, and any serial numbers or identifiers', required: true },
  { id: 'price', category: 'funds' as const, label: 'Agreed price', description: 'The price both parties have agreed to', required: true },
  { id: 'parties', category: 'info' as const, label: 'Buyer and seller email addresses', description: "We'll send each party a link to review and confirm", required: true },
  { id: 'wallet', category: 'account' as const, label: 'Secure account (wallet) connected', description: 'To hold funds and record the agreement', required: true },
  { id: 'date', category: 'info' as const, label: 'Expected completion date', description: 'When should this transaction be completed by?', required: false },
];

export default function SimpleTransactionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);
  const [data, setData] = useState<FormData>({
    assetType: '', assetDescription: '', assetValue: '',
    sellerName: '', sellerEmail: '', sellerWallet: '',
    buyerName: '', buyerEmail: '', buyerWallet: '',
    price: '', paymentMethod: 'escrow', conditions: '',
    closingDate: '', notes: '',
  });

  const update = (field: keyof FormData, value: string) => setData(prev => ({ ...prev, [field]: value }));
  const price = parseFloat(data.price) || 0;
  const networkFee = 0.01;

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SIMPLE_TRANSACTION',
          wizardData: data,
          purchasePrice: price,
          closingDate: data.closingDate ? new Date(data.closingDate) : null,
        }),
      });
      const contract = await res.json();
      setContractId(contract.id);
      toast.success('Agreement created! Both parties will receive email invitations.');
      setStep(6);
    } catch {
      toast.error('Failed to create agreement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <WizardProgress steps={STEPS} currentStep={step} estimatedMinutesRemaining={Math.max(1, (STEPS.length - step) * 3)} />

      {/* Step 1: What are you selling? */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">What are you selling?</h1>
            <p className="text-muted-foreground mt-1">Tell us about the item or asset being transferred.</p>
          </div>

          <WhatYouNeed items={WHAT_YOU_NEED} />

          <Card>
            <CardContent className="pt-6 space-y-4">
              <FieldWithHelp label="Asset type" helpText="What category does this fall into? Examples: vehicle, business, equipment, collectible, intellectual property" required htmlFor="assetType" example="Vehicle, Business, Equipment">
                <Input id="assetType" placeholder="e.g. 2019 Toyota Camry" value={data.assetType} onChange={e => update('assetType', e.target.value)} />
              </FieldWithHelp>

              <FieldWithHelp label="Description" helpText="Describe the item in detail. Include make, model, year, serial numbers, condition, and anything else important." required htmlFor="assetDesc" example="2019 Toyota Camry LE, 45,000 miles, VIN: 1HGBH41JXMN109186, excellent condition">
                <Textarea id="assetDesc" placeholder="Describe the item, its condition, and any identifying details..." rows={4} value={data.assetDescription} onChange={e => update('assetDescription', e.target.value)} />
              </FieldWithHelp>

              <FieldWithHelp label="Approximate value" helpText="What is this worth? This helps us provide relevant guidance. The actual sale price is set in Step 3." htmlFor="value" example="$15,000">
                <Input id="value" type="number" placeholder="25000" value={data.assetValue} onChange={e => update('assetValue', e.target.value)} />
              </FieldWithHelp>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Who's involved? */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">Who's involved?</h1>
            <p className="text-muted-foreground mt-1">We'll send each party an email link to review and confirm the agreement.</p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Seller (person transferring the asset)</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldWithHelp label="Seller's name" helpText="Full legal name of the person selling the asset" required htmlFor="sellerName">
                  <Input id="sellerName" placeholder="Jane Smith" value={data.sellerName} onChange={e => update('sellerName', e.target.value)} />
                </FieldWithHelp>
                <FieldWithHelp label="Seller's email" helpText="We'll email them a link to review and confirm" required htmlFor="sellerEmail">
                  <Input id="sellerEmail" type="email" placeholder="jane@example.com" value={data.sellerEmail} onChange={e => update('sellerEmail', e.target.value)} />
                </FieldWithHelp>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Buyer (person receiving the asset)</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FieldWithHelp label="Buyer's name" helpText="Full legal name of the person buying the asset" required htmlFor="buyerName">
                    <Input id="buyerName" placeholder="John Doe" value={data.buyerName} onChange={e => update('buyerName', e.target.value)} />
                  </FieldWithHelp>
                  <FieldWithHelp label="Buyer's email" helpText="We'll email them a link to review and confirm" required htmlFor="buyerEmail">
                    <Input id="buyerEmail" type="email" placeholder="john@example.com" value={data.buyerEmail} onChange={e => update('buyerEmail', e.target.value)} />
                  </FieldWithHelp>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <p className="text-xs text-blue-800">
                  <strong>Don't have a wallet address yet?</strong> No problem. We'll send email links — parties can create their secure account when they click the link.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Terms */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">What are the terms?</h1>
            <p className="text-muted-foreground mt-1">Set the price, conditions, and timeline.</p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FieldWithHelp label="Sale price" helpText="The total price the buyer will pay. The funds will be held securely until both parties confirm the transaction is complete." required htmlFor="price" example="$15,000">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input id="price" type="number" className="pl-7" placeholder="15000" value={data.price} onChange={e => update('price', e.target.value)} />
                </div>
              </FieldWithHelp>

              <FieldWithHelp label="Conditions for completion" helpText="What needs to happen before the buyer receives the asset and the seller receives payment? List any conditions here." htmlFor="conditions" example="Buyer inspects vehicle and approves condition; Seller provides clear title">
                <Textarea id="conditions" placeholder="What conditions must be met before payment is released?" rows={3} value={data.conditions} onChange={e => update('conditions', e.target.value)} />
              </FieldWithHelp>

              <FieldWithHelp label="Completion deadline" helpText="If the transaction isn't completed by this date, the buyer can request an automatic refund." htmlFor="closingDate">
                <Input id="closingDate" type="date" value={data.closingDate} onChange={e => update('closingDate', e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </FieldWithHelp>

              <FieldWithHelp label="Additional notes" helpText="Anything else both parties should know about this transaction." htmlFor="notes">
                <Textarea id="notes" placeholder="Any additional terms, warranties, or notes..." rows={2} value={data.notes} onChange={e => update('notes', e.target.value)} />
              </FieldWithHelp>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">Review Your Agreement</h1>
            <p className="text-muted-foreground mt-1">Here's what this agreement says in plain English. Review carefully before confirming.</p>
          </div>
          <PlainEnglishSummary
            title="Plain English Summary"
            summary={`${data.sellerName || 'The seller'} agrees to transfer "${data.assetType || 'the asset'}" to ${data.buyerName || 'the buyer'} for ${formatCurrency(price)}. The buyer's payment will be held securely until both parties confirm the transaction is complete. If the transaction isn't completed${data.closingDate ? ` by ${new Date(data.closingDate).toLocaleDateString()}` : ''}, the buyer can request a full refund.`}
            items={[
              { label: 'Asset', value: data.assetType || '—' },
              { label: 'Seller', value: `${data.sellerName} (${data.sellerEmail})` || '—' },
              { label: 'Buyer', value: `${data.buyerName} (${data.buyerEmail})` || '—' },
              { label: 'Sale price', value: formatCurrency(price), highlight: true },
              { label: 'Conditions', value: data.conditions || 'None specified' },
              { label: 'Deadline', value: data.closingDate ? formatCurrency(0).replace('$0', new Date(data.closingDate).toLocaleDateString()) : 'No deadline set' },
            ]}
            fees={[
              { label: 'Sale price', amount: price, paidBy: 'buyer' },
              { label: 'Network processing fee', amount: networkFee, paidBy: 'buyer', note: '≈$0.01 — one-time fee for creating the digital record' },
            ]}
            whatHappensNext={[
              { step: 'Both parties receive email invitations to review and confirm', timeline: 'Within minutes of creating the agreement' },
              { step: 'Buyer deposits funds into secure hold', timeline: 'After both parties confirm' },
              { step: 'Complete the transaction and confirm', timeline: 'Per your agreed conditions' },
              { step: 'Funds automatically release to seller', timeline: 'Once both parties confirm completion' },
            ]}
          />
        </div>
      )}

      {/* Step 5: Confirm & Create */}
      {step === 5 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">Confirm and Create</h1>
            <p className="text-muted-foreground mt-1">Ready to create your digital agreement? This will send invitations to both parties.</p>
          </div>
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2 text-sm">
                {[
                  `Selling: ${data.assetType}`,
                  `From ${data.sellerName} to ${data.buyerName}`,
                  `Price: ${formatCurrency(price)}`,
                  `Network fee: ≈$0.01`,
                ].map((line, i) => (
                  <div key={i} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /><span>{line}</span></div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">By creating this agreement, you confirm all details are correct and you agree to ChainDeed's terms of service.</p>
              <Button size="lg" className="w-full" onClick={handleCreate} loading={loading}>
                Create Agreement — {formatCurrency(price)} + $0.01 fee
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 6: Track Progress */}
      {step === 6 && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Agreement Created!</h1>
              <p className="text-muted-foreground">Invitations sent to {data.sellerEmail} and {data.buyerEmail}</p>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <p className="font-semibold">What happens next:</p>
              {[
                { done: true, text: '✅ Digital agreement created and recorded' },
                { done: false, text: `📧 Email sent to ${data.sellerEmail} to confirm` },
                { done: false, text: `📧 Email sent to ${data.buyerEmail} to confirm` },
                { done: false, text: '💰 Buyer deposits funds into secure hold' },
                { done: false, text: '✅ Both parties confirm completion' },
                { done: false, text: '🎉 Funds automatically released to seller' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm ${item.done ? 'text-green-700' : 'text-muted-foreground'}`}>
                  {item.text}
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="flex gap-3">
            {contractId && <Button asChild className="flex-1"><a href={`/contracts/${contractId}`}>View Agreement <ArrowRight className="h-4 w-4" /></a></Button>}
            <Button variant="outline" asChild className="flex-1"><a href="/dashboard">Back to Dashboard</a></Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 6 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          {step < 5 && (
            <Button onClick={() => setStep(s => s + 1)}>
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
