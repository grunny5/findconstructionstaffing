'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User, Mail, Lock, AlertTriangle } from 'lucide-react';

/**
 * Tab configuration for mobile settings navigation.
 * Includes Profile, Email, Password, and Account sections.
 */
const settingsTabs = [
  { name: 'Profile', href: '/settings', icon: User },
  { name: 'Email', href: '/settings/email', icon: Mail },
  { name: 'Password', href: '/settings/password', icon: Lock },
  {
    name: 'Account',
    href: '/settings/account',
    icon: AlertTriangle,
    danger: true,
  },
];

/**
 * Layout component for the settings section with authentication protection.
 *
 * This layout wraps all settings pages and provides:
 * - **Authentication Guard**: Redirects unauthenticated users to login
 * - **Responsive Navigation**:
 *   - Desktop (lg+): Sticky sidebar with SettingsSidebar component
 *   - Mobile/Tablet: Tab-based navigation using Shadcn/ui Tabs
 * - **Loading States**: Shows loading spinner while checking auth
 * - **Redirect Preservation**: Maintains redirectTo query param for post-login redirect
 *
 * The layout automatically:
 * 1. Checks user authentication status on mount
 * 2. Redirects to `/login?redirectTo=/settings/*` if not authenticated
 * 3. Displays appropriate navigation based on screen size
 *
 * @param props - Component props
 * @param props.children - Child components (settings pages) to render in the main content area
 * @returns Protected settings layout with responsive navigation
 *
 * @example
 * ```tsx
 * // In app/settings/page.tsx
 * export default function SettingsPage() {
 *   return <div>Settings content here</div>
 * }
 * // This page will automatically be wrapped by SettingsLayout
 * ```
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
      router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Desktop Layout with Sidebar */}
        <div className="hidden lg:flex lg:gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-8">
              <SettingsSidebar />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="rounded-lg bg-white shadow">{children}</div>
          </main>
        </div>

        {/* Mobile/Tablet Layout with Tabs */}
        <div className="lg:hidden">
          <Tabs value={pathname} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.href}
                    value={tab.href}
                    onClick={() => router.push(tab.href)}
                    className="flex flex-col items-center gap-1 data-[state=active]:text-blue-600"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs">{tab.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <TabsContent value={pathname} className="mt-0">
              <div className="rounded-lg bg-white shadow">{children}</div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
