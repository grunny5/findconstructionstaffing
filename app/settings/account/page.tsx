'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

/**
 * Account settings page component (placeholder) - Danger Zone.
 *
 * Future implementation will include destructive actions:
 * - Delete account permanently
 * - Export user data
 * - Deactivate account temporarily
 * - Revoke all active sessions
 *
 * This page should include strong warnings and confirmation dialogs
 * for all destructive actions.
 *
 * Currently displays a placeholder message with danger zone styling
 * to indicate the critical nature of these actions.
 *
 * @returns Account settings placeholder page with danger zone indication
 */
export default function SettingsAccountPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account and danger zone actions
        </p>
      </div>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Account deletion and other critical actions will be implemented in
              a future update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
