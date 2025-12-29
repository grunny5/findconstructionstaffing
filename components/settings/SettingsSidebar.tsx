'use client';

/**
 * SettingsSidebar Component - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 6.1 - Redesign Settings Pages
 *
 * Navigation sidebar with industrial styling for settings section.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User, Mail, Lock, AlertTriangle, Bell } from 'lucide-react';

/**
 * Props for the SettingsSidebar component.
 */
interface SettingsSidebarProps {
  /** Optional CSS class name for styling the sidebar container */
  className?: string;
}

/**
 * Navigation sections configuration for the settings sidebar.
 * Includes Profile, Email, Password, Notifications, and Account (danger zone) sections.
 */
const settingsSections = [
  {
    name: 'Profile',
    href: '/settings',
    icon: User,
    description: 'Manage your personal information',
  },
  {
    name: 'Email',
    href: '/settings/email',
    icon: Mail,
    description: 'Update your email address',
  },
  {
    name: 'Password',
    href: '/settings/password',
    icon: Lock,
    description: 'Change your password',
  },
  {
    name: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
    description: 'Manage notification preferences',
  },
  {
    name: 'Account',
    href: '/settings/account',
    icon: AlertTriangle,
    description: 'Manage your account settings',
    danger: true,
  },
];

/**
 * Sidebar navigation component for the settings section.
 *
 * Displays a list of navigation links to different settings sections:
 * - Profile: Manage personal information
 * - Email: Update email address
 * - Password: Change password
 * - Notifications: Manage notification preferences
 * - Account: Danger zone for destructive actions
 *
 * Features:
 * - Active section highlighting based on current route
 * - Keyboard navigation support
 * - Accessible ARIA labels
 * - Special styling for danger zone (Account section)
 *
 * @param props - Component props
 * @param props.className - Optional CSS class name for custom styling
 * @returns Navigation sidebar for settings pages
 *
 * @example
 * ```tsx
 * <SettingsSidebar className="w-64" />
 * ```
 */
export function SettingsSidebar({ className }: SettingsSidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn('space-y-1', className)}
      aria-label="Settings navigation"
    >
      {settingsSections.map((section) => {
        const isActive = pathname === section.href;
        const Icon = section.icon;

        return (
          <Link
            key={section.href}
            href={section.href}
            className={cn(
              // Industrial Design System: Navigation link
              'flex items-center gap-3 rounded-industrial-sharp px-3 py-3 font-body text-sm font-medium transition-colors',
              'border-l-4 border-transparent',
              'hover:bg-industrial-graphite-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-industrial-orange focus-visible:ring-offset-2',
              isActive
                ? 'bg-industrial-orange-100 border-l-industrial-orange text-industrial-graphite-600'
                : section.danger
                  ? 'text-industrial-orange hover:bg-industrial-orange-100'
                  : 'text-industrial-graphite-500 hover:text-industrial-graphite-600'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              className={cn(
                'h-5 w-5 flex-shrink-0',
                isActive
                  ? 'text-industrial-orange'
                  : section.danger
                    ? 'text-industrial-orange'
                    : 'text-industrial-graphite-400'
              )}
              aria-hidden="true"
            />
            <div className="flex-1">
              <div
                className={cn(
                  section.danger && !isActive && 'text-industrial-orange'
                )}
              >
                {section.name}
              </div>
              <div className="text-xs text-industrial-graphite-400 hidden lg:block">
                {section.description}
              </div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
