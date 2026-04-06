'use client';

import { FileText, ArrowRight, DollarSign, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';

interface SummaryItem { label: string; value: string; highlight?: boolean; }
interface FeeItem { label: string; amount: number; paidBy: 'buyer' | 'seller' | 'both'; note?: string; }
interface WhatNext { step: string; timeline: string; }

interface PlainEnglishSummaryProps {
  title: string;
  summary: string;
  items: SummaryItem[];
  fees?: FeeItem[];
  whatHappensNext?: WhatNext[];
  warnings?: string[];
  state?: string;
}

export function PlainEnglishSummary({ title, summary, items, fees, whatHappensNext, warnings, state }: PlainEnglishSummaryProps) {
  return (
    <div className="space-y-4">
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{title}</CardTitle>
            {state && <Badge variant="info" className="ml-auto">{state} Law Applies</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-4">
              <span className="text-sm text-muted-foreground shrink-0">{item.label}</span>
              <span className={`text-sm font-medium text-right ${item.highlight ? 'text-primary font-semibold' : ''}`}>{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {fees && fees.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Cost Breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {fees.map((fee, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <span className="text-sm">{fee.label}</span>
                  <Badge variant="outline" className="ml-2 text-xs">{fee.paidBy === 'buyer' ? 'You pay' : fee.paidBy === 'seller' ? 'Seller pays' : 'Split'}</Badge>
                  {fee.note && <p className="text-xs text-muted-foreground">{fee.note}</p>}
                </div>
                <span className="text-sm font-semibold">{formatCurrency(fee.amount)}</span>
              </div>
            ))}
            {fees.length > 1 && (
              <>
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-sm">Your total (buyer)</span>
                  <span className="text-sm">{formatCurrency(fees.filter(f => f.paidBy === 'buyer' || f.paidBy === 'both').reduce((s, f) => s + f.amount, 0))}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {warnings && warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">{w}</p>
            </div>
          ))}
        </div>
      )}

      {whatHappensNext && whatHappensNext.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">What Happens Next</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {whatHappensNext.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</div>
                <div>
                  <p className="text-sm font-medium">{item.step}</p>
                  <p className="text-xs text-muted-foreground">{item.timeline}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
