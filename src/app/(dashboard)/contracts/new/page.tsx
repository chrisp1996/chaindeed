import Link from 'next/link';
import { Home, FileText, TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const options = [
  {
    href: '/contracts/new/real-estate',
    icon: Home,
    title: 'Buy or Sell a Home',
    description: 'Full real estate purchase agreement with state-required disclosures, earnest money escrow, and step-by-step closing guidance.',
    badge: 'Ohio · Kentucky · Indiana',
    badgeVariant: 'info' as const,
    time: '~15 min to set up',
    features: ['Earnest money in secure hold', 'State disclosures auto-applied', 'Off-chain step checklist', 'Dual-track progress tracker'],
    recommended: true,
  },
  {
    href: '/contracts/new/simple',
    icon: FileText,
    title: 'Simple Agreement',
    description: 'For selling a car, business asset, equipment, or any item where you want both parties protected and funds held securely.',
    badge: 'Any state · Any asset',
    badgeVariant: 'secondary' as const,
    time: '~5 min to set up',
    features: ['Secure payment hold', 'Both parties confirm', 'Automatic refund if deadline passes'],
  },
  {
    href: '/contracts/new/tokenize',
    icon: TrendingUp,
    title: 'Tokenize a Property for Investment',
    description: 'List a property for fractional investment. Set share price, investor requirements, and manage your property DAO.',
    badge: 'Accredited investors',
    badgeVariant: 'pending' as const,
    time: '~20 min to set up',
    features: ['Fractional ownership shares', 'Rental income distribution', 'Investor voting (DAO)', 'KYC verification'],
  },
];

export default function NewContractPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Start a New Agreement</h1>
        <p className="text-muted-foreground mt-1">Choose the type of agreement that fits your situation.</p>
      </div>
      <div className="space-y-4">
        {options.map(({ href, icon: Icon, title, description, badge, badgeVariant, time, features, recommended }) => (
          <Link key={href} href={href}>
            <Card className={`cursor-pointer hover:border-primary/60 hover:shadow-md transition-all ${recommended ? 'border-2 border-primary/30' : ''}`}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-lg">{title}</h2>
                      {recommended && <Badge variant="success">Most common</Badge>}
                      <Badge variant={badgeVariant}>{badge}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
                    <ul className="mt-3 space-y-1">
                      {features.map(f => (
                        <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="h-1 w-1 rounded-full bg-primary" />{f}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">{time}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
