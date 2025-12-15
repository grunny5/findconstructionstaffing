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
import { Mail, Pencil, AlertCircle } from 'lucide-react';
import { EmailChangeForm } from './EmailChangeForm';

export function EmailSection() {
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
            Unable to load email
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
          <CardTitle>Email Address</CardTitle>
          <CardDescription>
            Manage your email address. Changing your email requires
            verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email Address
              </div>
              <div className="text-base font-medium">{profile.email}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditorOpen(true)}
              aria-label="Change email address"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Change Email
            </Button>
          </div>

          <div className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> When you change your email, we&apos;ll send
              verification links to both your current and new email addresses.
              You must click the link in your new email to complete the change.
            </p>
          </div>
        </CardContent>
      </Card>

      <EmailChangeForm
        currentEmail={profile.email}
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
      />
    </>
  );
}
