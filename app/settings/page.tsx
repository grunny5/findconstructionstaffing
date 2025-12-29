'use client';

/**
 * Settings Profile Page - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 6.1 - Redesign Settings Pages
 */

import { ProfileSection } from '@/components/settings/ProfileSection';
import { EmailSection } from '@/components/settings/EmailSection';
import { ClaimStatusList } from '@/components/ClaimStatusList';

/**
 * Settings profile page.
 * Displays user profile information, email management, and claim requests.
 */
export default function SettingsProfilePage() {
  return (
    <div className="p-6 space-y-6">
      {/* Section header with Bebas Neue */}
      <div>
        <h2 className="font-display text-2xl tracking-wide text-industrial-graphite-600">
          PROFILE
        </h2>
        <p className="mt-1 font-body text-sm text-industrial-graphite-400">
          View and manage your personal information and email address
        </p>
      </div>

      <ProfileSection />

      <EmailSection />

      <ClaimStatusList />
    </div>
  );
}
