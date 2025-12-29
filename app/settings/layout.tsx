'use client';

/**
 * Settings Layout - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 6.1 - Redesign Settings Pages
 */

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User, Mail, Lock, Bell, AlertTriangle } from 'lucide-react';

/**
 * Tab configuration for mobile settings navigation.
 * Includes Profile, Email, Password, Notifications, and Account sections.
 */
const settingsTabs = [
  { name: 'Profile', href: '/settings', icon: User },
  { name: 'Email', href: '/settings/email', icon: Mail },
  { name: 'Password', href: '/settings/password', icon: Lock },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell },
  {
    name: 'Account',
    href: '/settings/account',
    icon: AlertTriangle,
    danger: true,
  },
];

/**
 * Protected settings layout with authentication guard and responsive navigation.
 * Redirects unauthenticated users to login, preserving the return path.
 * Desktop: sticky sidebar. Mobile: tab-based navigation.
 */
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirectTo=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-industrial-bg-primary">
        <div className="font-body text-industrial-graphite-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-industrial-bg-primary">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Industrial header with Bebas Neue */}
        <div className="mb-8">
          <h1 className="font-display text-4xl uppercase tracking-wide text-industrial-graphite-600">
            Account Settings
          </h1>
          <p className="mt-2 font-body text-sm text-industrial-graphite-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Desktop: Sidebar + Content */}
        <div className="hidden lg:flex lg:gap-8">
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-8">
              <SettingsSidebar />
            </div>
          </aside>

          <main className="flex-1">
            <div className="rounded-industrial-sharp border-2 border-industrial-graphite-200 bg-industrial-bg-card">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile: Tab navigation */}
        <div className="lg:hidden">
          <Tabs value={pathname} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6 bg-industrial-graphite-100 rounded-industrial-sharp p-1">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.href}
                    value={tab.href}
                    onClick={() => router.push(tab.href)}
                    className="flex flex-col items-center gap-1 font-body text-industrial-graphite-500 rounded-industrial-sharp data-[state=active]:bg-industrial-bg-card data-[state=active]:text-industrial-orange data-[state=active]:shadow-sm"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs">{tab.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <TabsContent value={pathname} className="mt-0">
              <div className="rounded-industrial-sharp border-2 border-industrial-graphite-200 bg-industrial-bg-card">
                {children}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
