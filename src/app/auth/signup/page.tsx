'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/useAuth';
import { toast } from 'sonner';

const ROLES = [
  { value: 'BUYER', label: 'Buyer', desc: "I'm looking to buy property" },
  { value: 'SELLER', label: 'Seller', desc: "I'm selling property" },
  { value: 'AGENT', label: 'Agent / Broker', desc: "I represent buyers or sellers" },
];

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState('BUYER');
  const [loading, setLoading] = useState(false);

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ['', 'Too short', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-green-500'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signup(name, email, password, role);
    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }
    toast.success('Account created! Welcome to ChainDeed.');
    setLoading(false);
    router.replace(redirect);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-primary">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-bold">CD</div>
            ChainDeed
          </Link>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm">Free to join · No crypto knowledge needed</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPass ? 'text' : 'password'} placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} required className="pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(s => !s)}>
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${strength >= i ? strengthColor[strength] : 'bg-muted'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{strengthLabel[strength]}</p>
                  </div>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label>I am a...</Label>
                <div className="grid gap-2">
                  {ROLES.map(r => (
                    <button key={r.value} type="button"
                      onClick={() => setRole(r.value)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${role === r.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${role === r.value ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                        {role === r.value && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{r.label}</p>
                        <p className="text-xs text-muted-foreground">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Create Account <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to our Terms of Service. ChainDeed is not a law firm.
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
