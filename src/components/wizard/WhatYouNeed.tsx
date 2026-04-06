'use client';

import { FileText, CreditCard, User, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RequiredItem {
  id: string;
  category: 'document' | 'info' | 'account' | 'funds' | 'property';
  label: string;
  description?: string;
  required: boolean;
}

const categoryIcons = { document: FileText, info: User, account: CreditCard, funds: CreditCard, property: Home };
const categoryColors = {
  document: 'text-blue-600 bg-blue-50',
  info: 'text-purple-600 bg-purple-50',
  account: 'text-green-600 bg-green-50',
  funds: 'text-emerald-600 bg-emerald-50',
  property: 'text-orange-600 bg-orange-50',
};

export function WhatYouNeed({
  title = "What You'll Need",
  description = "Gather these items before you start. You can save and return anytime.",
  items,
}: { title?: string; description?: string; items: RequiredItem[] }) {
  const required = items.filter(i => i.required);
  const optional = items.filter(i => !i.required);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Required ({required.length} items)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {required.map(item => {
            const Icon = categoryIcons[item.category];
            return (
              <div key={item.id} className="flex items-start gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${categoryColors[item.category]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {optional.length > 0 && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Optional ({optional.length} items)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {optional.map(item => {
              const Icon = categoryIcons[item.category];
              return (
                <div key={item.id} className="flex items-start gap-3 opacity-70">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${categoryColors[item.category]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
        <p className="text-sm text-blue-800">
          <strong>Don't have everything yet?</strong> Your progress is saved automatically. Come back anytime — we'll send you a reminder email.
        </p>
      </div>
    </div>
  );
}
