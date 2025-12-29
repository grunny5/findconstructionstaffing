'use client';

/**
 * Notification Settings Page - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 6.1 - Redesign Settings Pages
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

/**
 * Notification preferences interface
 */
interface NotificationPreferences {
  email_enabled: boolean;
  email_batch_enabled: boolean;
  email_daily_digest_enabled: boolean;
}

/**
 * Notification preferences settings page with industrial styling.
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
      email_daily_digest_enabled: checked
        ? prev.email_daily_digest_enabled
        : false,
    }));
  };

  const handleBatchEnabledChange = (checked: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      email_batch_enabled: checked,
      // Disable digest if batch is enabled
      email_daily_digest_enabled: checked
        ? false
        : prev.email_daily_digest_enabled,
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
          <Loader2 className="h-8 w-8 animate-spin text-industrial-orange" />
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
          <h2 className="font-display text-2xl uppercase tracking-wide text-industrial-graphite-600">
            Notification Preferences
          </h2>
          <p className="mt-1 font-body text-sm text-industrial-graphite-400">
            Manage how you receive notifications about new messages
          </p>
        </div>

        <Separator />

        {/* Error Message */}
        {error && (
          <div className="rounded-industrial-sharp border-2 border-industrial-orange bg-industrial-orange-100 p-4">
            <p className="font-body text-sm text-industrial-orange">{error}</p>
          </div>
        )}

        {/* Email Notifications Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label
                htmlFor="email-enabled"
                className="font-body text-base font-medium text-industrial-graphite-600"
              >
                Email notifications
              </Label>
              <p className="font-body text-sm text-industrial-graphite-400">
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
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label
                htmlFor="batch-enabled"
                className={`font-body text-base font-medium ${!preferences.email_enabled ? 'text-industrial-graphite-300' : 'text-industrial-graphite-600'}`}
              >
                Batch notifications
              </Label>
              <p
                className={`font-body text-sm ${!preferences.email_enabled ? 'text-industrial-graphite-300' : 'text-industrial-graphite-400'}`}
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
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label
                htmlFor="digest-enabled"
                className={`font-body text-base font-medium ${!preferences.email_enabled ? 'text-industrial-graphite-300' : 'text-industrial-graphite-600'}`}
              >
                Daily digest
              </Label>
              <p
                className={`font-body text-sm ${!preferences.email_enabled ? 'text-industrial-graphite-300' : 'text-industrial-graphite-400'}`}
              >
                Receive a summary email at 8:00 AM instead of real-time
                notifications
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
        <div className="rounded-industrial-sharp border-2 border-industrial-graphite-200 bg-industrial-graphite-100 p-4">
          <p className="font-body text-sm text-industrial-graphite-600">
            <strong>Note:</strong> Batch notifications and daily digest are
            mutually exclusive. Enabling one will automatically disable the
            other.
          </p>
        </div>
      </div>
    </div>
  );
}
