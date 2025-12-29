'use client';

/**
 * EmailSection Component - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 6.1 - Redesign Settings Pages
 */

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
import { Pencil, AlertCircle } from 'lucide-react';
import { EmailChangeForm } from './EmailChangeForm';

/**
 * Email address management section with edit capability.
 */
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
      <Card className="border-2 border-industrial-orange rounded-industrial-sharp">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-industrial-graphite-600">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-industrial-orange" />
            <div>
              <p className="font-body font-medium">Unable to load email</p>
              <p className="font-body text-sm text-industrial-graphite-400 mt-1">
                Please try refreshing the page. If the problem persists, contact
                support.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-industrial-graphite-200 rounded-industrial-sharp bg-industrial-bg-card">
        <CardHeader>
          <CardTitle className="font-display text-xl uppercase tracking-wide text-industrial-graphite-600">
            Email Address
          </CardTitle>
          <CardDescription className="font-body text-industrial-graphite-400">
            Manage your email address. Changing your email requires
            verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <label className="block font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide">
                Current Email
              </label>
              <p className="mt-1 font-body text-sm text-industrial-graphite-600">
                {profile.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditorOpen(true)}
              className="mt-0 -mr-2 text-industrial-orange hover:text-industrial-orange-600 hover:bg-industrial-orange-100"
              aria-label="Change email address"
            >
              <Pencil className="h-4 w-4 mr-1" />
              Change
            </Button>
          </div>

          <div className="rounded-industrial-sharp border-2 border-industrial-graphite-200 bg-industrial-graphite-100 p-4">
            <p className="font-body text-sm text-industrial-graphite-600">
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
