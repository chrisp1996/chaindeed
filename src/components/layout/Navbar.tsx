'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, FileText, TrendingUp, Menu, X, Bell, User, LogOut, LogIn, CheckCheck } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const nav = [
  { href: '/dashboard',      label: 'Dashboard',     icon: Home      },
  { href: '/contracts/new',  label: 'New Agreement', icon: FileText  },
  { href: '/invest',         label: 'Invest',        icon: TrendingUp },
];

// Friendly label map for notification types
const TYPE_LABEL: Record<string, string> = {
  SIGNATURE_NEEDED:           'Signature needed',
  DOCUMENT_UPLOADED:          'Document uploaded',
  DOCUMENT_REQUIRED:          'Document required',
  DEADLINE_APPROACHING:       'Deadline approaching',
  STEP_COMPLETED:             'Step completed',
  STEP_OVERDUE:               'Step overdue',
  FUNDS_DEPOSITED:            'Funds deposited',
  FUNDS_RELEASED:             'Funds released',
  DISPUTE_RAISED:             'Dispute raised',
  HOMESTEAD_REMINDER:         'Homestead reminder',
  SALES_DISCLOSURE_REMINDER:  'Sales disclosure reminder',
  KYC_APPROVED:               'KYC approved',
  KYC_REJECTED:               'KYC rejected',
  GENERAL:                    'Notification',
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60)   return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  const [notifications, setNotifications]   = useState<any[]>([]);
  const [notifOpen,     setNotifOpen]       = useState(false);

  const unreadCount = notifications.filter(n => !n.readAt).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) setNotifications(await res.json());
    } catch { /* silent */ }
  }, [user]);

  // Load on sign-in, then refresh every 60 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  };

  const handleMarkRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
  };

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between px-4 mx-auto">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold">CD</div>
          ChainDeed
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">

          {/* Bell — only shown when signed in */}
          {!loading && user && (
            <DropdownMenu open={notifOpen} onOpenChange={open => { setNotifOpen(open); if (open) fetchNotifications(); }}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hidden md:flex">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-80 p-0">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b">
                  <p className="text-sm font-semibold">Notifications</p>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                      <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">No new notifications</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">We'll notify you about activity on your agreements.</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <button
                        key={n.id}
                        onClick={() => {
                          if (!n.readAt) handleMarkRead(n.id);
                          if (n.contractId) router.push(`/contracts/${n.contractId}`);
                          setNotifOpen(false);
                        }}
                        className={cn(
                          'w-full text-left px-3 py-3 border-b last:border-b-0 transition-colors hover:bg-accent',
                          !n.readAt && 'bg-primary/5'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {!n.readAt && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                          <div className={cn('flex-1 min-w-0', n.readAt && 'pl-4')}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {TYPE_LABEL[n.type] ?? 'Notification'}
                            </p>
                            <p className="text-sm leading-snug mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Account dropdown / Sign-in button */}
          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hidden md:flex">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                      {(user.name ?? user.email).charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{user.name ?? 'Account'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" /> My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login" className="hidden md:flex">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <LogIn className="h-4 w-4" /> Sign In
                </Button>
              </Link>
            )
          )}

          {/* Mobile menu toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-3 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium',
                pathname.startsWith(href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4" />{label}
            </Link>
          ))}
          <div className="pt-2 border-t">
            {user ? (
              <>
                <Link href="/account" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" /> My Account
                </Link>
                {unreadCount > 0 && (
                  <Link href="/account" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground">
                    <Bell className="h-4 w-4" />
                    Notifications
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </Link>
                )}
                <button onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-destructive">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </>
            ) : (
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-primary">
                <LogIn className="h-4 w-4" /> Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
