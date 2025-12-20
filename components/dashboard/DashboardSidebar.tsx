'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Settings,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface DashboardSidebarProps {
  agencySlug: string;
  agencyName: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

/**
 * Render a responsive dashboard sidebar for an agency.
 *
 * Displays a mobile slide-in menu and a fixed desktop aside containing navigation
 * links (Overview, Profile, Services, Analytics). Active link highlighting and
 * disabled-item handling ("Coming Soon") are applied automatically based on the
 * current route and the `agencySlug`.
 *
 * @param agencySlug - Slug used to construct each navigation item's href
 * @param agencyName - Display name shown in the sidebar header and mobile sheet title
 * @returns A React element containing the agency dashboard navigation UI
 */
export function DashboardSidebar({
  agencySlug,
  agencyName,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navigation: NavItem[] = [
    {
      name: 'Overview',
      href: `/dashboard/agency/${agencySlug}`,
      icon: LayoutDashboard,
    },
    {
      name: 'Profile',
      href: `/dashboard/agency/${agencySlug}/profile`,
      icon: Building2,
    },
    {
      name: 'Services',
      href: `/dashboard/agency/${agencySlug}/services`,
      icon: Settings,
    },
    {
      name: 'Analytics',
      href: `/dashboard/agency/${agencySlug}/analytics`,
      icon: BarChart3,
      disabled: true,
    },
  ];

  const isActive = (href: string) => {
    if (href === `/dashboard/agency/${agencySlug}`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav
      className="space-y-1"
      aria-label="Dashboard navigation"
      role="navigation"
    >
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.name}
            href={item.disabled ? '#' : item.href}
            onClick={(e) => {
              if (item.disabled) {
                e.preventDefault();
                return;
              }
              if (isMobile) {
                setOpen(false);
              }
            }}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : item.disabled
                  ? 'text-muted-foreground cursor-not-allowed opacity-50'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            aria-current={active ? 'page' : undefined}
            aria-disabled={item.disabled}
          >
            <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <span>{item.name}</span>
            {item.disabled && (
              <span className="ml-auto text-xs">(Coming Soon)</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Hamburger Menu */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed top-4 left-4 z-40"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle>{agencyName}</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <NavLinks isMobile />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:bg-background"
        aria-label="Sidebar"
      >
        <div className="flex flex-col flex-1 min-h-0 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h2 className="text-lg font-semibold">{agencyName}</h2>
          </div>
          <div className="mt-8 flex-1 px-3">
            <NavLinks />
          </div>
        </div>
      </aside>
    </>
  );
}