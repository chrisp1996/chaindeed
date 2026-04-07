'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ActionCenter, OnChainStep, OffChainStep } from '@/components/action-center/ActionCenter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, getContractStatusLabel, formatDate } from '@/lib/utils';
import { FileText, Home, DollarSign, Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';

// Mock on-chain steps — in production, read from deployed contract events
const MOCK_ON_CHAIN_STEPS: OnChainStep[] = [
  { id: '1', title: 'Agreement created', status: 'complete', description: 'Digital agreement recorded permanently', timestamp: new Date(Date.now() - 86400000 * 3) },
  { id: '2', title: 'Buyer confirmed', status: 'complete', description: 'Buyer reviewed and confirmed the agreement', timestamp: new Date(Date.now() - 86400000 * 2) },
  { id: '3', title: 'Seller confirmed', status: 'in_progress', description: 'Waiting for seller to review and confirm' },
  { id: '4', title: 'Earnest money deposited', status: 'pending', description: 'Buyer deposits funds into secure hold' },
  { id: '5', title: 'All conditions met', status: 'pending', description: 'Title clear, disclosures delivered, inspection done' },
  { id: '6', title: 'Deed registered digitally', status: 'pending', description: 'Ownership permanently recorded' },
];

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/contracts/${id}`)
      .then(r => r.json())
      .then(c => { setContract(c); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleUpdateStep = async (stepId: string, status: string) => {
    const res = await fetch(`/api/off-chain-steps/${stepId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setContract((prev: any) => prev ? {
        ...prev,
        offChainSteps: prev.offChainSteps.map((s: any) => s.id === stepId ? updated : s),
      } : prev);
      toast.success('Step updated!');
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" /></div>;

  if (!contract) return (
    <div className="text-center py-20 space-y-3">
      <p className="text-lg font-semibold">Agreement not found</p>
      <Button asChild variant="outline"><a href="/dashboard">Back to Dashboard</a></Button>
    </div>
  );

  const offChainSteps: OffChainStep[] = (contract.offChainSteps || []).map((s: any) => ({
    id: s.id, stepKey: s.stepKey, title: s.title, plainEnglishTitle: s.title,
    description: s.description, responsibility: s.responsibility?.toLowerCase() || 'buyer',
    estimatedCost: s.estimatedCost, estimatedTime: s.estimatedTime,
    isRequired: s.isRequired, isBlocker: s.isBlocker,
    status: s.status as OffChainStep['status'],
    uploadedDocCid: s.uploadedDocCid, notes: s.notes,
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{contract.property?.streetAddress || 'Transaction Agreement'}</h1>
            <Badge variant="info">{getContractStatusLabel(contract.status)}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {contract.property?.city && `${contract.property.city}, ${contract.property.state} · `}
            {contract.purchasePrice && `${formatCurrency(contract.purchasePrice)} · `}
            Created {formatDate(contract.createdAt)}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/contracts/${id}/pdf`} download>
            <Download className="h-4 w-4 mr-2" />Download Summary PDF
          </a>
        </Button>
      </div>

      {/* Key details */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Purchase Price', value: contract.purchasePrice ? formatCurrency(contract.purchasePrice) : '—' },
          { icon: Home, label: 'Property', value: contract.property?.streetAddress || '—' },
          { icon: Calendar, label: 'Closing Date', value: contract.closingDate ? formatDate(contract.closingDate) : 'TBD' },
          { icon: FileText, label: 'State', value: contract.state || '—' },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1"><Icon className="h-4 w-4" /><span className="text-xs">{label}</span></div>
              <p className="font-semibold text-sm truncate">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Action Center */}
      <ActionCenter
        contractId={id}
        onChainSteps={MOCK_ON_CHAIN_STEPS}
        offChainSteps={offChainSteps.length > 0 ? offChainSteps : [
          { id: 'demo1', stepKey: 'demo', title: 'No off-chain steps yet', plainEnglishTitle: 'No steps required', description: 'Off-chain steps will appear here once the contract state is set.', responsibility: 'buyer', isRequired: false, isBlocker: false, status: 'PENDING' },
        ]}
        onUpdateOffChainStep={handleUpdateStep}
        currentUserRole="buyer"
      />
    </div>
  );
}
