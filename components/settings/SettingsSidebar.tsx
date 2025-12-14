'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User, Mail, Lock, AlertTriangle } from 'lucide-react';

interface SettingsSidebarProps {
  className?: string;
}

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
