import Link from 'next/link';
import { ArrowRight, Shield, Clock, FileCheck, Home, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';

const features = [
  { icon: Shield, title: 'Funds Held Securely', description: 'Your earnest money is held in a digital escrow — automatically released only when all conditions are met. No third party can touch it.' },
  { icon: Clock, title: 'Step-by-Step Guidance', description: 'We guide you through every step — both the digital parts and the paperwork. Like TurboTax, but for real estate.' },
  { icon: FileCheck, title: 'State Law Built In', description: 'Ohio, Kentucky, and Indiana state requirements are automatically applied. Required disclosures, transfer taxes, and waiting periods — handled.' },
  { icon: Home, title: 'For Regular People', description: 'No technical knowledge required. If you can use an online banking app, you can use ChainDeed.' },
];

const steps = [
  { num: 1, title: 'Describe your transaction', desc: 'Tell us about the property and parties involved. Takes about 5 minutes.' },
  { num: 2, title: 'Both parties confirm', desc: 'Buyer and seller both review and agree digitally. We send email links if needed.' },
  { num: 3, title: 'Funds go into secure hold', desc: 'Earnest money is held safely until closing conditions are met.' },
  { num: 4, title: 'Complete your checklist', desc: 'We guide you through inspections, disclosures, title search, and recording.' },
  { num: 5, title: 'Close and transfer', desc: 'Once everything checks out, funds release and ownership transfers.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge variant="info" className="text-sm px-4 py-1">Now available in Ohio, Kentucky & Indiana</Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Buy & Sell Real Estate<br />
            <span className="text-primary">With Total Confidence</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            ChainDeed creates secure digital agreements for real estate transactions. Your money is protected, every step is tracked, and state law requirements are handled automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" asChild>
              <Link href="/contracts/new/real-estate">
                Start a Real Estate Transaction <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/invest">Browse Investment Properties</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">No technical knowledge required · Guided step-by-step · Progress saved automatically</p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground mt-2">Five simple steps from agreement to closed transaction</p>
          </div>
          <div className="grid sm:grid-cols-5 gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className="flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg">{s.num}</div>
                <div>
                  <p className="font-semibold text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                </div>
                {i < steps.length - 1 && <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground absolute" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Built for Real People</h2>
            <p className="text-muted-foreground mt-2">Not for developers or crypto experts — for buyers, sellers, and agents</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardContent className="pt-6 flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* State coverage */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">State-Specific Legal Requirements — Handled</h2>
          <p className="text-muted-foreground">Each state has different laws, forms, and requirements. ChainDeed knows them all and guides you through every one.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { state: 'Ohio', items: ['ORC 5302.30 Disclosure', 'County Conveyance Fee', 'E-Recording Ready'] },
              { state: 'Kentucky', items: ['Transfer Tax $0.50/$500', 'County Clerk Recording', 'PVA Notification'] },
              { state: 'Indiana', items: ['Sales Disclosure Form', 'Seller Disclosure Required', 'Homestead Reminder'] },
            ].map(({ state, items }) => (
              <Card key={state}>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-3">{state}</h3>
                  <ul className="space-y-1.5">
                    {items.map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-muted-foreground">Create your first agreement in minutes. No credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" asChild>
              <Link href="/onboarding">Get Started — It's Free <ArrowRight className="h-5 w-5" /></Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/contracts/new/simple">Try a Simple Agreement</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        <p>ChainDeed — Digital agreements for real estate. Not a law firm. Consult an attorney for legal advice.</p>
        <p className="mt-1">© {new Date().getFullYear()} ChainDeed. Available in Ohio, Kentucky, and Indiana.</p>
      </footer>
    </div>
  );
}
