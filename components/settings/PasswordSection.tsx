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
import { Lock, AlertCircle } from 'lucide-react';
import { PasswordChangeForm } from './PasswordChangeForm';

export function PasswordSection() {
  const { user, profile, loading } = useAuth();
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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
            Unable to load password settings
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
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Manage your password. We recommend using a strong, unique password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Lock className="h-4 w-4" />
                Password
              </div>
              <div className="text-base font-medium">••••••••••••</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditorOpen(true)}
              aria-label="Change password"
            >
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </div>

          <div className="p-4 border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <strong>Security Tip:</strong> Use a password that is at least 6
              characters long and includes a mix of letters, numbers, and
              symbols. You&apos;ll need to enter your current password to make
              changes.
            </p>
          </div>
        </CardContent>
      </Card>

      <PasswordChangeForm
        currentEmail={profile.email}
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
      />
    </>
  );
}
