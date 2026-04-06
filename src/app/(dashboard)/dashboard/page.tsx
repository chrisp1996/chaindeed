'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';
import { Plus, ArrowRight, Home, FileText, TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getContractStatusLabel } from '@/lib/utils';

// Sample data — replaced with real API calls in production
const sampleContracts = [
  { id: '1', type: 'REAL_ESTATE_PURCHASE', status: 'IN_ESCROW', property: '123 Main St, Columbus, OH 43201', price: 285000, updatedAt: new Date(), stepsComplete: 4, stepsTotal: 7 },
  { id: '2', type: 'SIMPLE_TRANSACTION', status: 'PENDING_SIGNATURES', property: 'Business Asset Sale', price: 15000, updatedAt: new Date(Date.now() - 86400000), stepsComplete: 2, stepsTotal: 6 },
];

const statusIcon = { IN_ESCROW: Clock, PENDING_SIGNATURES: AlertTriangle, CLOSED: CheckCircle2, ACTIVE: CheckCircle2, DISPUTED: AlertTriangle };
const statusVariant: Record<string, any> = { IN_ESCROW: 'info', PENDING_SIGNATURES: 'warning', CLOSED: 'success', ACTIVE: 'success', DISPUTED: 'destructive' };

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Home className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Connect Your Secure Account</h2>
        <p className="text-muted-foreground max-w-sm">Connect your secure account to view your transactions and create new agreements.</p>
        <Button asChild size="lg"><Link href="/onboarding">Get Started</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Transactions</h1>
          <p className="text-muted-foreground mt-1">Manage all your real estate agreements in one place.</p>
        </div>
        <Button asChild>
          <Link href="/contracts/new"><Plus className="h-4 w-4 mr-2" />New Agreement</Link>
        </Button>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: '/contracts/new/real-estate', icon: Home, title: 'Buy or Sell a Home', desc: 'Ohio, Kentucky, or Indiana', color: 'bg-blue-50 text-blue-600' },
          { href: '/contracts/new/simple', icon: FileText, title: 'Simple Agreement', desc: 'Any asset or transaction', color: 'bg-purple-50 text-purple-600' },
          { href: '/contracts/new/tokenize', icon: TrendingUp, title: 'Tokenize a Property', desc: 'List for fractional investment', color: 'bg-green-50 text-green-600' },
        ].map(({ href, icon: Icon, title, desc, color }) => (
          <Link key={href} href={href}>
            <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="pt-6 flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Contracts list */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Active Transactions</h2>
        {sampleContracts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No transactions yet. Start a new agreement above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sampleContracts.map(contract => {
              const StatusIcon = statusIcon[contract.status as keyof typeof statusIcon] || Clock;
              return (
                <Link key={contract.id} href={`/contracts/${contract.id}`}>
                  <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
                    <CardContent className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Home className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{contract.property}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={statusVariant[contract.status] || 'pending'} className="text-xs">
                              {getContractStatusLabel(contract.status)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{formatCurrency(contract.price)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">Progress</p>
                          <p className="text-sm font-medium">{contract.stepsComplete}/{contract.stepsTotal} steps</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
