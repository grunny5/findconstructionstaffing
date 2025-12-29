'use client';

/**
 * Email Settings Page - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 6.1 - Redesign Settings Pages
 */

import { EmailSection } from '@/components/settings/EmailSection';

/**
 * Email settings page component.
 * Uses EmailSection for email display and change management.
 */
export default function SettingsEmailPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="font-display text-2xl uppercase tracking-wide text-industrial-graphite-600">
          Email Settings
        </h2>
        <p className="mt-1 font-body text-sm text-industrial-graphite-400">
          Manage your email address and preferences
        </p>
      </div>

      <EmailSection />
    </div>
  );
}
