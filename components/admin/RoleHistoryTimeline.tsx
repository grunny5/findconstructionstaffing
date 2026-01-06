'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { Clock, User, AlertCircle } from 'lucide-react';
import { roleDisplayName, roleBadgeVariant } from '@/lib/utils/role';
import type { RoleChangeAudit } from '@/types/database';

interface RoleHistoryTimelineProps {
  userId: string;
}

interface AuditLogWithAdmin extends RoleChangeAudit {
  admin_profile?: {
    full_name: string;
    email: string;
  } | null;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function RoleHistoryTimeline({ userId }: RoleHistoryTimelineProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLogWithAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch audit logs for this user with admin profile info
        const { data, error: fetchError } = await supabase
          .from('role_change_audit')
          .select(
            `
            *,
            admin_profile:profiles!admin_id (
              full_name,
              email
            )
          `
          )
          .eq('user_id', userId)
          .order('changed_at', { ascending: false });

        if (fetchError) throw fetchError;

        setAuditLogs((data as AuditLogWithAdmin[]) || []);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load role history'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [userId]);

  if (loading) {
    return (
      <Card className="border-l-4 border-l-industrial-orange">
        <CardHeader>
          <CardTitle>Role Change History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-industrial-graphite-500">
            <div className="animate-pulse font-body">Loading history...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-l-industrial-orange">
        <CardHeader>
          <CardTitle>Role Change History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 py-8 text-industrial-orange-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-body">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <Card className="border-l-4 border-l-industrial-orange">
        <CardHeader>
          <CardTitle>Role Change History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 font-body text-industrial-graphite-500">
            No role changes recorded
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-industrial-orange">
      <CardHeader>
        <CardTitle>Role Change History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {auditLogs.map((log, index) => (
            <div key={log.id}>
              <div className="flex flex-col gap-3">
                {/* Timestamp */}
                <div className="flex items-center gap-2 font-body text-sm text-industrial-graphite-500">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(log.changed_at)}</span>
                </div>

                {/* Role Change */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={roleBadgeVariant(log.old_role)}>
                    {roleDisplayName(log.old_role)}
                  </Badge>
                  <span className="text-industrial-graphite-400">→</span>
                  <Badge variant={roleBadgeVariant(log.new_role)}>
                    {roleDisplayName(log.new_role)}
                  </Badge>
                </div>

                {/* Admin Info */}
                {log.admin_profile && (
                  <div className="flex items-center gap-2 font-body text-sm text-industrial-graphite-600">
                    <User className="h-4 w-4" />
                    <span>
                      Changed by:{' '}
                      <span className="font-semibold">
                        {log.admin_profile.full_name || log.admin_profile.email}
                      </span>
                    </span>
                  </div>
                )}

                {!log.admin_profile && log.admin_id && (
                  <div className="flex items-center gap-2 font-body text-sm text-industrial-graphite-500">
                    <User className="h-4 w-4" />
                    <span className="italic">
                      Changed by: [Admin account deleted]
                    </span>
                  </div>
                )}

                {/* Notes */}
                {log.notes && (
                  <div className="pl-6 font-body text-sm text-industrial-graphite-600 border-l-2 border-industrial-orange">
                    {log.notes}
                  </div>
                )}
              </div>

              {/* Separator between entries */}
              {index < auditLogs.length - 1 && (
                <Separator className="mt-6 bg-industrial-graphite-200" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
