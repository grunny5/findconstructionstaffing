'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Bell, Loader2 } from 'lucide-react';

/**
 * Notification preferences interface
 */
interface NotificationPreferences {
  email_enabled: boolean;
  email_batch_enabled: boolean;
  email_daily_digest_enabled: boolean;
}

/**
 * Settings Page: Notification Preferences
 *
 * Allows users to manage their email notification preferences:
 * - Enable/disable email notifications for new messages
 * - Enable/disable batch mode (wait 5 minutes before sending)
 * - Enable/disable daily digest (send summary at 8:00 AM)
 *
 * Features:
 * - Fetches current preferences from API
 * - Displays loading state while fetching
 * - Shows error message if fetch fails
 * - Validates and saves preferences to API
 * - Shows success/error toast notifications
 * - Disables batch/digest toggles when email is disabled
 *
 * @returns Notification preferences settings page component
 */
export default function NotificationsSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_enabled: true,
    email_batch_enabled: true,
    email_daily_digest_enabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================================================
  // FETCH PREFERENCES ON MOUNT
  // ==========================================================================

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/settings/notification-preferences');

        if (!response.ok) {
          throw new Error('Failed to fetch notification preferences');
        }

        const result = await response.json();
        if (result.data) {
          setPreferences(result.data);
        }
      } catch (err) {
        console.error('Error fetching preferences:', err);
        setError('Failed to load notification preferences. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // ==========================================================================
  // SAVE PREFERENCES
  // ==========================================================================

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch('/api/settings/notification-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to save notification preferences');
      }

      toast.success('Notification preferences updated');
    } catch (err) {
      console.error('Error saving preferences:', err);
      toast.error('Failed to save notification preferences');
      setError('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================================================
  // TOGGLE HANDLERS
  // ==========================================================================

  const handleEmailEnabledChange = (checked: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      email_enabled: checked,
      // Disable batch and digest if email is disabled
      email_batch_enabled: checked ? prev.email_batch_enabled : false,
      email_daily_digest_enabled: checked ? prev.email_daily_digest_enabled : false,
    }));
  };

  const handleBatchEnabledChange = (checked: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      email_batch_enabled: checked,
      // Disable digest if batch is enabled
      email_daily_digest_enabled: checked ? false : prev.email_daily_digest_enabled,
    }));
  };

  const handleDigestEnabledChange = (checked: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      email_daily_digest_enabled: checked,
      // Disable batch if digest is enabled
      email_batch_enabled: checked ? false : prev.email_batch_enabled,
    }));
  };

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">
              Notification Preferences
            </h2>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Manage how you receive notifications about new messages
          </p>
        </div>

        <Separator />

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Email Notifications Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="email-enabled" className="text-base font-medium">
                Email notifications
              </Label>
              <p className="text-sm text-gray-600">
                Receive email notifications for new messages
              </p>
            </div>
            <Switch
              id="email-enabled"
              checked={preferences.email_enabled}
              onCheckedChange={handleEmailEnabledChange}
            />
          </div>

          {/* Batch Mode Toggle */}
          <div className="flex items-center justify-between opacity-100 data-[disabled=true]:opacity-50">
            <div className="flex-1">
              <Label
                htmlFor="batch-enabled"
                className={`text-base font-medium ${!preferences.email_enabled ? 'text-gray-400' : ''}`}
              >
                Batch notifications
              </Label>
              <p
                className={`text-sm ${!preferences.email_enabled ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Wait 5 minutes before sending email (reduces email volume)
              </p>
            </div>
            <Switch
              id="batch-enabled"
              checked={preferences.email_batch_enabled}
              onCheckedChange={handleBatchEnabledChange}
              disabled={!preferences.email_enabled}
            />
          </div>

          {/* Daily Digest Toggle */}
          <div className="flex items-center justify-between opacity-100 data-[disabled=true]:opacity-50">
            <div className="flex-1">
              <Label
                htmlFor="digest-enabled"
                className={`text-base font-medium ${!preferences.email_enabled ? 'text-gray-400' : ''}`}
              >
                Daily digest
              </Label>
              <p
                className={`text-sm ${!preferences.email_enabled ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Receive a summary email at 8:00 AM instead of real-time notifications
              </p>
            </div>
            <Switch
              id="digest-enabled"
              checked={preferences.email_daily_digest_enabled}
              onCheckedChange={handleDigestEnabledChange}
              disabled={!preferences.email_enabled}
            />
          </div>
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Batch notifications and daily digest are mutually exclusive.
            Enabling one will automatically disable the other.
          </p>
        </div>
      </div>
    </div>
  );
}
