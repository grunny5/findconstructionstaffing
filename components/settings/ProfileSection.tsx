'use client';

/**
 * ProfileSection Component - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 6.1 - Redesign Settings Pages
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, AlertCircle } from 'lucide-react';
import { ProfileEditor } from './ProfileEditor';

/**
 * Profile information display section with edit capability.
 * Shows user's full name, email, role badge, and account creation date.
 * Includes inline editing via ProfileEditor dialog with optimistic updates.
 */
export function ProfileSection() {
  const { user, profile, loading } = useAuth();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [optimisticName, setOptimisticName] = useState<string | null>(null);

  // Reset optimistic name when profile.full_name changes (e.g., from server refresh)
  useEffect(() => {
    setOptimisticName(null);
  }, [profile?.full_name]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
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
              <p className="font-body font-medium">Unable to load profile</p>
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

  const handleEditSuccess = (newName: string) => {
    setOptimisticName(newName);
  };

  const displayName = optimisticName ?? profile.full_name;

  return (
    <>
      <Card className="border-2 border-industrial-graphite-200 rounded-industrial-sharp bg-industrial-bg-card">
        <CardHeader>
          <CardTitle className="font-display text-xl uppercase tracking-wide text-industrial-graphite-600">
            Personal Information
          </CardTitle>
          <CardDescription className="font-body text-industrial-graphite-400">
            Your profile information is displayed below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <label className="block font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide">
                Full Name
              </label>
              <p className="mt-1 font-body text-sm text-industrial-graphite-600">
                {displayName || 'Not set'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditorOpen(true)}
              className="mt-0 -mr-2 text-industrial-orange hover:text-industrial-orange-600 hover:bg-industrial-orange-100"
              aria-label="Edit full name"
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>

          <div>
            <label className="block font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide">
              Email Address
            </label>
            <p className="mt-1 font-body text-sm text-industrial-graphite-600">
              {user.email}
            </p>
            <p className="mt-1 font-body text-xs text-industrial-graphite-400">
              Email changes are managed in the Email section
            </p>
          </div>

          <div>
            <label className="block font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide">
              Role
            </label>
            <div className="mt-1">
              <Badge
                variant={
                  profile.role === 'admin'
                    ? 'destructive'
                    : profile.role === 'agency_owner'
                      ? 'default'
                      : 'secondary'
                }
              >
                {profile.role === 'admin'
                  ? 'Admin'
                  : profile.role === 'agency_owner'
                    ? 'Agency Owner'
                    : 'User'}
              </Badge>
            </div>
          </div>

          <div>
            <label className="block font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide">
              Account Created
            </label>
            <p className="mt-1 font-body text-sm text-industrial-graphite-600">
              {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Unknown'}
            </p>
          </div>
        </CardContent>
      </Card>

      <ProfileEditor
        userId={user.id}
        currentName={profile.full_name}
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
