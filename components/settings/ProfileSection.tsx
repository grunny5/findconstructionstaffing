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
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Unable to load profile</p>
              <p className="text-sm text-red-700 mt-1">
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
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Your profile information is displayed below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {displayName || 'Not set'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditorOpen(true)}
              className="mt-0 -mr-2"
              aria-label="Edit full name"
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          <p className="mt-1 text-xs text-gray-500">
            Email changes are managed in the Email section
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
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
          <label className="block text-sm font-medium text-gray-700">
            Account Created
          </label>
          <p className="mt-1 text-sm text-gray-900">
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
