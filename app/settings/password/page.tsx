'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

/**
 * Password settings page component (placeholder).
 *
 * Future implementation will allow users to:
 * - Change their current password
 * - View password strength requirements
 * - Enable two-factor authentication
 * - View active sessions and security logs
 *
 * Currently displays a placeholder message indicating the feature
 * is not yet implemented.
 *
 * @returns Password settings placeholder page
 */
export default function SettingsPasswordPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Password Settings</h2>
        <p className="mt-1 text-sm text-gray-600">
          Change your password and manage security
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              Password change functionality will be implemented in a future
              update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
