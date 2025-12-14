'use client';

import { ProfileSection } from '@/components/settings/ProfileSection';

/**
 * Settings profile page.
 * Displays user profile information with inline editing capability.
 */
export default function SettingsProfilePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
        <p className="mt-1 text-sm text-gray-600">
          View and manage your personal information
        </p>
      </div>

      <ProfileSection />

      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Click the Edit button to update your full name.
          Email changes are managed in the Email section.
        </p>
      </div>
    </div>
  );
}
