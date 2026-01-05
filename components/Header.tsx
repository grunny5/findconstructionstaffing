'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  Building2,
  Users,
  FileText,
  Search,
  User,
  LogOut,
  LayoutDashboard,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { UnreadBadge } from '@/components/messages/UnreadBadge';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { cn } from '@/lib/utils';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, agencySlug, signOut } = useAuth();
  const pathname = usePathname();
  const { unreadCount } = useUnreadCount(!!user);

  const navItems = [
    { label: 'Browse Directory', href: '/', icon: Building2 },
    { label: 'Request Labor', href: '/request-labor', icon: Users },
    { label: 'Resources', href: '/resources', icon: FileText },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-industrial-bg-card border-b-[3px] border-industrial-graphite-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header height: h-20 = 5rem = 80px (defined as --header-height in globals.css) */}
        <div className="flex justify-between items-center h-20">
          {/* Industrial Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-industrial-graphite-600 rounded-industrial-sharp flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-display text-2xl uppercase tracking-wide text-industrial-graphite-600">
                Find Construction
              </span>
              <div className="font-body text-xs uppercase tracking-widest text-industrial-graphite-400">
                Staffing
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-body text-sm font-semibold uppercase tracking-wide text-industrial-graphite-500 border-b-2 border-transparent hover:border-industrial-orange-400 hover:text-industrial-graphite-600 transition-all duration-200 pb-1"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              // Logged in - show Claim Listing + Messages + User Menu
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-body text-sm font-semibold uppercase tracking-wide border-2 border-industrial-graphite-300 text-industrial-graphite-500 hover:border-industrial-graphite-600 hover:text-industrial-graphite-600 rounded-industrial-sharp transition-all duration-200"
                  asChild
                >
                  <Link href="/claim-listing">Claim Listing</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'font-body text-sm font-semibold uppercase tracking-wide border-2 border-industrial-graphite-300 text-industrial-graphite-500 hover:border-industrial-graphite-600 hover:text-industrial-graphite-600 rounded-industrial-sharp transition-all duration-200 relative',
                    pathname?.startsWith('/messages') &&
                      'bg-industrial-graphite-100 border-industrial-graphite-600 text-industrial-graphite-600'
                  )}
                  asChild
                >
                  <Link href="/messages" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <UnreadBadge count={unreadCount} max={9} />
                    )}
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="font-body text-sm font-semibold uppercase tracking-wide bg-industrial-orange text-white hover:bg-industrial-orange-500 rounded-industrial-sharp h-9 px-4 transition-all duration-200"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {profile?.full_name ||
                        user.email?.split('@')[0] ||
                        'Account'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {profile?.full_name || 'My Account'}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {profile?.role === 'admin' &&
                      isFeatureEnabled('adminDashboard') && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin/integrations">
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                    {profile?.role === 'agency_owner' && agencySlug && (
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/agency/${agencySlug}`}>
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Agency Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isFeatureEnabled('accountSettings') && (
                      <DropdownMenuItem asChild>
                        <Link href="/account">Account Settings</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Not logged in - show Sign In / Sign Up
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-body text-sm font-semibold uppercase tracking-wide border-2 border-industrial-graphite-300 text-industrial-graphite-500 hover:border-industrial-graphite-600 hover:text-industrial-graphite-600 rounded-industrial-sharp transition-all duration-200"
                  asChild
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  size="sm"
                  className="font-body text-sm font-semibold uppercase tracking-wide bg-industrial-orange text-white hover:bg-industrial-orange-500 rounded-industrial-sharp h-9 px-4 transition-all duration-200"
                  asChild
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="text-industrial-graphite-600 hover:text-industrial-graphite-600 hover:bg-industrial-graphite-100"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-6 mt-8">
                <div className="flex items-center space-x-3 pb-4 border-b-2 border-industrial-graphite-200">
                  <div className="w-10 h-10 bg-industrial-graphite-600 rounded-industrial-sharp flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="font-display text-xl uppercase tracking-wide text-industrial-graphite-600">
                      Find Construction
                    </span>
                    <div className="font-body text-xs uppercase tracking-widest text-industrial-graphite-400">
                      Staffing
                    </div>
                  </div>
                </div>

                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 font-body text-base font-semibold uppercase tracking-wide text-industrial-graphite-500 hover:text-industrial-graphite-600 transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}

                <div className="border-t-2 border-industrial-graphite-200 pt-6 space-y-3">
                  {user ? (
                    // Logged in - show user-specific actions
                    <>
                      <Button
                        variant="outline"
                        className="w-full font-body text-sm font-semibold uppercase tracking-wide border-2 border-industrial-graphite-300 text-industrial-graphite-500 hover:border-industrial-graphite-600 hover:text-industrial-graphite-600 rounded-industrial-sharp transition-all duration-200"
                        asChild
                      >
                        <Link
                          href="/claim-listing"
                          onClick={() => setIsOpen(false)}
                        >
                          Claim Listing
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full font-body text-sm font-semibold uppercase tracking-wide border-2 border-industrial-graphite-300 text-industrial-graphite-500 hover:border-industrial-graphite-600 hover:text-industrial-graphite-600 rounded-industrial-sharp transition-all duration-200 relative',
                          pathname?.startsWith('/messages') &&
                            'bg-industrial-graphite-100 border-industrial-graphite-600 text-industrial-graphite-600'
                        )}
                        asChild
                      >
                        <Link
                          href="/messages"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>Messages</span>
                          {unreadCount > 0 && (
                            <UnreadBadge count={unreadCount} max={9} />
                          )}
                        </Link>
                      </Button>
                      {profile?.role === 'admin' &&
                        isFeatureEnabled('adminDashboard') && (
                          <Button
                            className="w-full font-body text-sm font-semibold uppercase tracking-wide bg-industrial-orange text-white hover:bg-industrial-orange-500 rounded-industrial-sharp transition-all duration-200"
                            asChild
                          >
                            <Link
                              href="/admin/integrations"
                              onClick={() => setIsOpen(false)}
                            >
                              Admin Dashboard
                            </Link>
                          </Button>
                        )}
                      {profile?.role === 'agency_owner' && agencySlug && (
                        <Button
                          className="w-full font-body text-sm font-semibold uppercase tracking-wide bg-industrial-orange text-white hover:bg-industrial-orange-500 rounded-industrial-sharp transition-all duration-200"
                          asChild
                        >
                          <Link
                            href={`/dashboard/agency/${agencySlug}`}
                            onClick={() => setIsOpen(false)}
                          >
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            Agency Dashboard
                          </Link>
                        </Button>
                      )}
                      {isFeatureEnabled('accountSettings') && (
                        <Button
                          variant="outline"
                          className="w-full font-body text-sm font-semibold uppercase tracking-wide border-2 border-industrial-graphite-300 text-industrial-graphite-500 hover:border-industrial-graphite-600 hover:text-industrial-graphite-600 rounded-industrial-sharp transition-all duration-200"
                          asChild
                        >
                          <Link
                            href="/account"
                            onClick={() => setIsOpen(false)}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Account Settings
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="w-full font-body text-sm font-semibold uppercase tracking-wide border-2 border-industrial-graphite-300 text-industrial-graphite-500 hover:border-industrial-graphite-600 hover:text-industrial-graphite-600 rounded-industrial-sharp transition-all duration-200"
                        onClick={() => {
                          handleSignOut();
                          setIsOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    // Not logged in - show Sign In / Sign Up
                    <>
                      <Button
                        variant="outline"
                        className="w-full font-body text-sm font-semibold uppercase tracking-wide border-2 border-industrial-graphite-300 text-industrial-graphite-500 hover:border-industrial-graphite-600 hover:text-industrial-graphite-600 rounded-industrial-sharp transition-all duration-200"
                        asChild
                      >
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                      <Button
                        className="w-full font-body text-sm font-semibold uppercase tracking-wide bg-industrial-orange text-white hover:bg-industrial-orange-500 rounded-industrial-sharp transition-all duration-200"
                        asChild
                      >
                        <Link href="/signup" onClick={() => setIsOpen(false)}>
                          Sign Up
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
