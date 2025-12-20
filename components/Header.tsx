'use client';

import { useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { isFeatureEnabled } from '@/lib/feature-flags';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, agencySlug, signOut } = useAuth();

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
    <header className="glass-header sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Modern Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold gradient-text-primary">
                Construction
              </span>
              <div className="text-xs text-slate-500 font-medium">
                Recruiter Directory
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              // Logged in - show Claim Listing + User Menu
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-button"
                  asChild
                >
                  <Link href="/claim-listing">Claim Listing</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="modern-button-primary h-9 px-4"
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
                  className="glass-button"
                  asChild
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  size="sm"
                  className="modern-button-primary h-9 px-4"
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
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-6 mt-8">
                <div className="flex items-center space-x-3 pb-4 border-b">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="font-bold gradient-text-primary">
                      Construction
                    </span>
                    <div className="text-xs text-slate-500 font-medium">
                      Recruiter Directory
                    </div>
                  </div>
                </div>

                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 text-lg font-medium text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}

                <div className="border-t pt-6 space-y-3">
                  {user ? (
                    // Logged in - show user-specific actions
                    <>
                      <Button
                        variant="outline"
                        className="w-full glass-button"
                        asChild
                      >
                        <Link
                          href="/claim-listing"
                          onClick={() => setIsOpen(false)}
                        >
                          Claim Listing
                        </Link>
                      </Button>
                      {profile?.role === 'admin' &&
                        isFeatureEnabled('adminDashboard') && (
                          <Button
                            className="w-full modern-button-primary"
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
                          className="w-full modern-button-primary"
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
                        <Button variant="outline" className="w-full" asChild>
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
                        className="w-full"
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
                        className="w-full glass-button"
                        asChild
                      >
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                      <Button className="w-full modern-button-primary" asChild>
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
