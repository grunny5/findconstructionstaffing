'use client';

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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
        <p className="mt-1 text-sm text-gray-600">
          View and manage your personal information and email address
        </p>
      </div>

      <ProfileSection />

      <EmailSection />

      <ClaimStatusList />
    </div>
  );
}
