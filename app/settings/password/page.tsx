'use client';

/**
 * Password Settings Page - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 6.1 - Redesign Settings Pages
 */

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

/**
 * Password settings page component (placeholder).
 */
export default function SettingsPasswordPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="font-display text-2xl tracking-wide text-industrial-graphite-600">
          PASSWORD SETTINGS
        </h2>
        <p className="mt-1 font-body text-sm text-industrial-graphite-400">
          Change your password and manage security
        </p>
      </div>

      <Card className="border-2 border-industrial-graphite-200 rounded-industrial-sharp bg-industrial-bg-card">
        <CardHeader>
          <CardTitle className="font-display text-xl tracking-wide text-industrial-graphite-600">
            CHANGE PASSWORD
          </CardTitle>
          <CardDescription className="font-body text-industrial-graphite-400">
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-industrial-sharp bg-industrial-graphite-100 p-4">
            <p className="font-body text-sm text-industrial-graphite-500">
              Password change functionality will be implemented in a future
              update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
