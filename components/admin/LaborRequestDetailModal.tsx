'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Type definitions
interface Notification {
  id: string;
  agency: {
    id: string;
    agency_name: string;
    slug: string;
  };
  status: 'pending' | 'sent' | 'failed' | 'new' | 'viewed' | 'responded' | 'archived';
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  delivery_error: string | null;
}

interface Craft {
  id: string;
  trade: {
    id: string;
    name: string;
  };
  region: {
    id: string;
    name: string;
    state_code: string;
  };
  worker_count: number;
  start_date: string;
  duration_days: number;
  hours_per_week: number;
  notes: string | null;
  notifications: Notification[];
}

interface LaborRequestDetail {
  id: string;
  project_name: string;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  status: 'pending' | 'active' | 'fulfilled' | 'cancelled';
  created_at: string;
  updated_at: string;
  crafts: Craft[];
}

interface LaborRequestDetailModalProps {
  requestId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export function LaborRequestDetailModal({
  requestId,
  onClose,
  onRefresh,
}: LaborRequestDetailModalProps) {
  const { toast } = useToast();
  const [request, setRequest] = useState<LaborRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');

  const fetchRequestDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/labor-requests/${requestId}`);
      if (!response.ok) throw new Error('Failed to fetch request details');

      const data = await response.json();
      setRequest(data.data);
      setNewStatus(data.data.status);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load request details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [requestId, toast]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/labor-requests/${requestId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });
      onRefresh();
      fetchRequestDetails();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Labor Request Details</DialogTitle>
          <DialogDescription>
            View full request information and notification status
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : request ? (
          <div className="space-y-6">
            {/* Request Info Section */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Request Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Project Name</p>
                  <p className="font-medium">{request.project_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{request.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Email</p>
                  <p className="font-medium">{request.contact_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Phone</p>
                  <p className="font-medium">{request.contact_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="flex items-center gap-2">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="fulfilled">Fulfilled</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    {newStatus !== request.status && (
                      <Button
                        onClick={handleStatusUpdate}
                        disabled={isUpdating}
                        size="sm"
                      >
                        Update
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Craft Requirements Section */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Craft Requirements</h3>
              <div className="space-y-4">
                {request.crafts?.map((craft: any) => (
                  <div key={craft.id} className="border-l-2 border-blue-500 pl-4">
                    <p className="font-medium">
                      {craft.worker_count}x {craft.trade.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {craft.region.name}, {craft.region.state_code} • Start: {new Date(craft.start_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {craft.notifications?.length || 0} agencies notified
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications Section */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Notification Status</h3>
              <div className="space-y-2">
                {request.crafts?.flatMap((craft: any) =>
                  craft.notifications?.map((notif: any) => (
                    <div key={notif.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{notif.agency.agency_name}</p>
                        <p className="text-sm text-gray-600">
                          {craft.trade.name} in {craft.region.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={notif.status === 'failed' ? 'destructive' : 'default'}>
                          {notif.status}
                        </Badge>
                        {notif.delivery_error && (
                          <span className="text-xs text-red-600">
                            {notif.delivery_error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <p>Request not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
