'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User, Mail, Lock, AlertTriangle } from 'lucide-react';

/**
 * Props for the SettingsSidebar component.
 */
interface SettingsSidebarProps {
  /** Optional CSS class name for styling the sidebar container */
  className?: string;
}

/**
 * Navigation sections configuration for the settings sidebar.
 * Includes Profile, Email, Password, and Account (danger zone) sections.
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
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              isActive
                ? 'bg-blue-50 text-blue-700'
                : section.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-700 hover:text-gray-900'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              className={cn(
                'h-5 w-5 flex-shrink-0',
                isActive
                  ? 'text-blue-700'
                  : section.danger
                    ? 'text-red-600'
                    : 'text-gray-400'
              )}
              aria-hidden="true"
            />
            <div className="flex-1">
              <div className={cn(section.danger && 'text-red-600')}>
                {section.name}
              </div>
              <div className="text-xs text-gray-500 hidden lg:block">
                {section.description}
              </div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
