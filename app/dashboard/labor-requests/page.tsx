'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Briefcase, Calendar, MapPin, Users, Search, Filter, AlertCircle } from 'lucide-react';
import type { InboxNotification } from '@/types/labor-request';

export default function LaborRequestsInboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, agencySlug, loading: authLoading, isAgencyOwner } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard/labor-requests');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (agencySlug) {
      fetchNotifications();
    }
  }, [agencySlug, statusFilter]);

  const fetchNotifications = async () => {
    if (!agencySlug) return;

    setDataLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(
        `/api/agencies/${agencySlug}/labor-requests?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch labor requests');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching labor requests:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSearch = () => {
    fetchNotifications();
  };

  const formatDate = (isoDate: string) => {
    // Handle date-only strings (YYYY-MM-DD) to avoid timezone shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      const [year, month, day] = isoDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }

    // Handle full ISO timestamps
    return new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      new: 'default',
      viewed: 'secondary',
      responded: 'outline',
      archived: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPayRateDisplay = (notification: InboxNotification) => {
    const { pay_rate_min, pay_rate_max } = notification.craft;
    // Use nullish checks to handle 0 values correctly
    if (pay_rate_min != null && pay_rate_max != null) {
      return `$${pay_rate_min}-$${pay_rate_max}/hr`;
    }
    if (pay_rate_min != null) {
      return `$${pay_rate_min}+/hr`;
    }
    return 'Rate negotiable';
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // Not authenticated - will redirect
  if (!user) {
    return null;
  }

  // Not an agency owner
  if (!isAgencyOwner || !agencySlug) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">Access Restricted</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-orange-800 mb-4">
              This page is only available to agency owners who have claimed an agency profile.
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Data loading state
  if (dataLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Labor Requests</h1>
          <p className="text-gray-600 mt-1">
            {notifications.length} {notifications.length === 1 ? 'request' : 'requests'} matched to your agency
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by project or company name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Button */}
            <Button onClick={handleSearch}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No labor requests found
            </h3>
            <p className="text-gray-600">
              {statusFilter !== 'all' || searchQuery
                ? 'Try adjusting your filters or search query.'
                : 'You haven\'t been matched to any labor requests yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const handleNavigate = () => {
              router.push(`/dashboard/labor-requests/${notification.labor_request.id}?notificationId=${notification.id}`);
            };

            const handleKeyDown = (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleNavigate();
              }
            };

            return (
              <Card
                key={notification.id}
                className="hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={handleNavigate}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="button"
                aria-label={`View labor request for ${notification.labor_request.project_name} from ${notification.labor_request.company_name}`}
              >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">
                        {notification.labor_request.project_name}
                      </CardTitle>
                      {getStatusBadge(notification.status)}
                    </div>
                    <CardDescription>
                      {notification.labor_request.company_name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Craft Info */}
                  <div className="flex items-start gap-2">
                    <Briefcase className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {notification.craft.worker_count} {notification.craft.trade.name}
                        {notification.craft.worker_count > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-600">
                        {notification.craft.experience_level}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {notification.craft.region.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {notification.craft.region.state_code}
                      </p>
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(notification.craft.start_date)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {notification.craft.duration_days} days
                      </p>
                    </div>
                  </div>

                  {/* Pay Rate */}
                  <div className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getPayRateDisplay(notification)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {notification.craft.hours_per_week} hrs/week
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Received {formatDate(notification.created_at)}
                  </p>
                  <Button variant="outline" size="sm">
                    View Details →
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      )}
    </div>
  );
}
