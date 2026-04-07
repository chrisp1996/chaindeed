'use client';

import { useState } from 'react';
import { Shield, Users, FileText, AlertTriangle, CheckCircle2, Clock, BarChart3, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const MOCK_KYC = [
  { id: '1', name: 'John Smith', email: 'john@example.com', submittedAt: new Date(Date.now() - 7200000), status: 'PENDING', docs: ['drivers_license.pdf', 'utility_bill.pdf'] },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', submittedAt: new Date(Date.now() - 86400000), status: 'PENDING', docs: ['passport.pdf'] },
  { id: '3', name: 'Mike Williams', email: 'mike@example.com', submittedAt: new Date(Date.now() - 172800000), status: 'APPROVED', docs: ['drivers_license.pdf'] },
];

const MOCK_FLAGS = [
  { id: '1', contractId: 'abc123', reason: 'Unusual transaction pattern — same wallet buyer and seller', flaggedAt: new Date(Date.now() - 3600000), reviewed: false },
  { id: '2', contractId: 'def456', reason: 'Property value significantly below market — possible distressed sale', flaggedAt: new Date(Date.now() - 86400000), reviewed: false },
];

const MOCK_TRANSACTIONS = [
  { id: '1', type: 'REAL_ESTATE_PURCHASE', address: '123 Main St, Columbus, OH', amount: 285000, status: 'IN_ESCROW', createdAt: new Date(Date.now() - 172800000) },
  { id: '2', type: 'SIMPLE_TRANSACTION', address: 'Vehicle Sale — 2019 Toyota', amount: 15000, status: 'CLOSED', createdAt: new Date(Date.now() - 604800000) },
  { id: '3', type: 'REAL_ESTATE_PURCHASE', address: '456 Oak Ave, Louisville, KY', amount: 340000, status: 'PENDING_SIGNATURES', createdAt: new Date(Date.now() - 86400000) },
];

const stats = [
  { label: 'Total Transactions', value: '3', icon: FileText, color: 'text-blue-600 bg-blue-50' },
  { label: 'KYC Pending', value: '2', icon: Users, color: 'text-amber-600 bg-amber-50' },
  { label: 'Active Disputes', value: '0', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  { label: 'Completed', value: '1', icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
];

export default function AdminPage() {
  const [search, setSearch] = useState('');
  const [kycList, setKycList] = useState(MOCK_KYC);
  const [kycLoading, setKycLoading] = useState<string | null>(null);

  async function handleKyc(userId: string, action: 'approve' | 'reject') {
    setKycLoading(userId);
    try {
      const res = await fetch(`/api/admin/kyc/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setKycList(prev => prev.map(k => k.id === userId
          ? { ...k, status: action === 'approve' ? 'APPROVED' : 'REJECTED' }
          : k
        ));
        toast.success(action === 'approve' ? 'User approved — confirmation email sent.' : 'User rejected — notification sent.');
      } else {
        toast.error('Action failed. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setKycLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold">CD</div>
            <div>
              <p className="font-semibold">ChainDeed Admin</p>
              <p className="text-xs text-muted-foreground">Compliance & Operations</p>
            </div>
          </div>
          <Badge variant="warning"><Shield className="h-3 w-3 mr-1" />Admin Access</Badge>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}><Icon className="h-5 w-5" /></div>
                <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="kyc" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="kyc">KYC Review ({MOCK_KYC.filter(k => k.status === 'PENDING').length} pending)</TabsTrigger>
            <TabsTrigger value="flags">Fraud Flags ({MOCK_FLAGS.filter(f => !f.reviewed).length})</TabsTrigger>
            <TabsTrigger value="transactions">All Transactions</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          {/* KYC Review */}
          <TabsContent value="kyc" className="space-y-4">
            <h2 className="text-lg font-semibold">Identity Verification Queue</h2>
            {kycList.map(kyc => (
              <Card key={kyc.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{kyc.name}</p>
                        <Badge variant={kyc.status === 'APPROVED' ? 'success' : kyc.status === 'REJECTED' ? 'destructive' : 'warning'}>{kyc.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{kyc.email}</p>
                      <p className="text-xs text-muted-foreground">Submitted {new Date(kyc.submittedAt).toLocaleString()}</p>
                      <div className="flex gap-2 mt-2">
                        {kyc.docs.map(doc => (
                          <Badge key={doc} variant="outline" className="text-xs cursor-pointer hover:bg-muted">{doc}</Badge>
                        ))}
                      </div>
                    </div>
                    {kyc.status === 'PENDING' && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="success"
                          loading={kycLoading === kyc.id}
                          onClick={() => handleKyc(kyc.id, 'approve')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive"
                          loading={kycLoading === kyc.id}
                          onClick={() => handleKyc(kyc.id, 'reject')}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Fraud Flags */}
          <TabsContent value="flags" className="space-y-4">
            <h2 className="text-lg font-semibold">Automated Fraud Flags</h2>
            {MOCK_FLAGS.map(flag => (
              <Card key={flag.id} className="border-amber-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <p className="font-medium text-sm">Contract #{flag.contractId}</p>
                        <Badge variant="warning">Unreviewed</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{flag.reason}</p>
                      <p className="text-xs text-muted-foreground">{new Date(flag.flaggedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline">Review</Button>
                      <Button size="sm" variant="ghost">Dismiss</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* All Transactions */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search transactions..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              {MOCK_TRANSACTIONS.filter(t => !search || t.address.toLowerCase().includes(search.toLowerCase())).map(t => (
                <Card key={t.id}>
                  <CardContent className="pt-3 pb-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">{t.address}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={t.status === 'CLOSED' ? 'success' : t.status === 'IN_ESCROW' ? 'info' : 'pending'} className="text-xs">{t.status}</Badge>
                        <span className="text-xs text-muted-foreground">{formatCurrency(t.amount)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" asChild><a href={`/contracts/${t.id}`}>View</a></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Disputes */}
          <TabsContent value="disputes">
            <div className="text-center py-12 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
              <p className="text-muted-foreground">No active disputes</p>
            </div>
          </TabsContent>

          {/* Audit Log */}
          <TabsContent value="audit" className="space-y-2">
            <h2 className="text-lg font-semibold">Document Audit Trail</h2>
            {[
              { action: 'Document uploaded', detail: 'Seller disclosure — contract #abc123', user: 'jane@example.com', cid: 'bafybeig...', time: '2 hours ago' },
              { action: 'KYC approved', detail: 'User: mike@example.com', user: 'admin@chaindeed.io', cid: null, time: '1 day ago' },
              { action: 'Contract created', detail: 'Real estate purchase — $285,000', user: 'john@example.com', cid: null, time: '2 days ago' },
            ].map((log, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b last:border-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{log.detail}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{log.user}</span>
                    {log.cid && <span className="text-xs font-mono text-primary">{log.cid}</span>}
                    <span className="text-xs text-muted-foreground ml-auto">{log.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
