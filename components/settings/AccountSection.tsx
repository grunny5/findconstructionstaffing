'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, AlertCircle } from 'lucide-react';
import { DeleteAccountModal } from './DeleteAccountModal';

export function AccountSection() {
  const { user, profile, loading } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!user || !profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Unable to load account settings
          </CardTitle>
          <CardDescription>
            Please try refreshing the page. If the problem persists, contact
            support.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account permanently.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              aria-label="Delete account"
              className="ml-4"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>

          <div className="p-4 border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <strong>⚠️ Before you delete your account:</strong>
            </p>
            <ul className="mt-2 text-sm text-amber-900 dark:text-amber-100 list-disc list-inside space-y-1">
              <li>Make sure you have saved any important data</li>
              <li>This will delete all your profile information</li>
              <li>You will lose access to your account immediately</li>
              <li>This action cannot be reversed or recovered</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <DeleteAccountModal
        currentEmail={profile.email}
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
      />
    </>
  );
}
