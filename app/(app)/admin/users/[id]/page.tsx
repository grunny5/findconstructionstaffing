import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { RoleHistoryTimeline } from '@/components/admin/RoleHistoryTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { roleDisplayName, roleBadgeVariant } from '@/lib/utils/role';
import { UserEditButton } from '@/components/admin/UserEditButton';
import type { Profile } from '@/types/database';

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/login');
    return null;
  }

  // Check admin authorization
  const { data: currentUserProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (
    profileError ||
    !currentUserProfile ||
    currentUserProfile.role !== 'admin'
  ) {
    redirect('/');
    return null;
  }

  // Fetch target user
  const { data: targetUser, error: userError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at, updated_at')
    .eq('id', params.id)
    .single();

  if (userError || !targetUser) {
    notFound();
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl min-h-screen">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </Link>
      </div>

      {/* Page header with title and actions */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl lg:text-3xl uppercase tracking-wide text-industrial-graphite-600">
          User Details
        </h1>
        <div className="flex gap-2">
          <UserEditButton user={targetUser} />
        </div>
      </div>

      {/* User profile card */}
      <Card className="mb-6 border-l-4 border-l-industrial-orange">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                Full Name
              </label>
              <p className="mt-1 font-body text-base text-industrial-graphite-600">
                {targetUser.full_name || 'Not provided'}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                Email
              </label>
              <p className="mt-1 font-body text-base text-industrial-graphite-600">
                {targetUser.email}
              </p>
            </div>

            {/* Role */}
            <div>
              <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                Role
              </label>
              <div className="mt-1">
                <Badge variant={roleBadgeVariant(targetUser.role)}>
                  {roleDisplayName(targetUser.role)}
                </Badge>
              </div>
            </div>

            {/* Created At */}
            <div>
              <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                Account Created
              </label>
              <p className="mt-1 font-body text-base text-industrial-graphite-600">
                {formatDate(targetUser.created_at)}
              </p>
            </div>

            {/* Updated At */}
            <div>
              <label className="font-body text-xs uppercase font-semibold tracking-widest text-industrial-graphite-400">
                Last Updated
              </label>
              <p className="mt-1 font-body text-base text-industrial-graphite-600">
                {formatDate(targetUser.updated_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role History Timeline */}
      <RoleHistoryTimeline userId={params.id} />
    </div>
  );
}
