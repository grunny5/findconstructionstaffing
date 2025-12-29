'use client';

/**
 * Account Settings Page - Industrial Design System
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
 * Account settings page component (placeholder) - Danger Zone.
 */
export default function SettingsAccountPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="font-display text-2xl uppercase tracking-wide text-industrial-graphite-600">
          Account Settings
        </h2>
        <p className="mt-1 font-body text-sm text-industrial-graphite-400">
          Manage your account and danger zone actions
        </p>
      </div>

      <Card className="border-2 border-industrial-orange rounded-industrial-sharp bg-industrial-bg-card">
        <CardHeader>
          <CardTitle className="font-display text-xl uppercase tracking-wide text-industrial-orange">
            Danger Zone
          </CardTitle>
          <CardDescription className="font-body text-industrial-graphite-400">
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-industrial-sharp bg-industrial-orange-100 p-4">
            <p className="font-body text-sm text-industrial-graphite-600">
              Account deletion and other critical actions will be implemented in
              a future update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
