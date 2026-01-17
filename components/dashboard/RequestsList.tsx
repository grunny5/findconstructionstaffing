'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Briefcase, Calendar, MapPin, Users, Search, Filter } from 'lucide-react';

interface Notification {
  id: string;
  status: 'pending' | 'sent' | 'failed' | 'new' | 'viewed' | 'responded' | 'archived';
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  delivery_error: string | null;
  craft: {
    id: string;
    worker_count: number;
    start_date: string;
    duration_days: number;
    hours_per_week: number;
    experience_level: string;
    pay_rate_min: number | null;
    pay_rate_max: number | null;
    per_diem_rate: number | null;
    notes: string | null;
    trade: {
      id: string;
      name: string;
    };
    region: {
      id: string;
      name: string;
      state_code: string;
    };
  };
  labor_request: {
    id: string;
    project_name: string;
    company_name: string;
    contact_email: string;
    contact_phone: string;
    created_at: string;
  };
}

interface RequestsListProps {
  initialData: Notification[];
  agencySlug: string;
  initialStatus: string;
  initialSearch: string;
}

export function RequestsList({
  initialData,
  agencySlug,
  initialStatus,
  initialSearch,
}: RequestsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'all') {
      params.append('status', statusFilter);
    }
    if (searchQuery) {
      params.append('search', searchQuery);
    }

    const queryString = params.toString();
    router.push(`/dashboard/agency/${agencySlug}/requests${queryString ? `?${queryString}` : ''}`);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    const params = new URLSearchParams();
    if (value && value !== 'all') {
      params.append('status', value);
    }
    if (searchQuery) {
      params.append('search', searchQuery);
    }

    const queryString = params.toString();
    router.push(`/dashboard/agency/${agencySlug}/requests${queryString ? `?${queryString}` : ''}`);
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

  const getPayRateDisplay = (notification: Notification) => {
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

  return (
    <>
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-industrial-graphite-400" />
                <Input
                  type="text"
                  placeholder="Search by project or company name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 font-body"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="font-body">
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
            <Button onClick={handleSearch} className="font-body">
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {initialData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-industrial-graphite-400 mx-auto mb-4" />
            <h3 className="font-display text-lg uppercase tracking-wide text-industrial-graphite-600 mb-2">
              No labor requests found
            </h3>
            <p className="font-body text-industrial-graphite-400">
              {statusFilter !== 'all' || searchQuery
                ? 'Try adjusting your filters or search query.'
                : "You haven't been matched to any labor requests yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {initialData.map((notification) => {
            const handleNavigate = () => {
              router.push(
                `/dashboard/agency/${agencySlug}/requests/${notification.labor_request.id}?notificationId=${notification.id}`
              );
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
                className="hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-industrial-burnt-500"
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
                        <CardTitle className="font-display text-xl uppercase tracking-wide">
                          {notification.labor_request.project_name}
                        </CardTitle>
                        {getStatusBadge(notification.status)}
                      </div>
                      <CardDescription className="font-body">
                        {notification.labor_request.company_name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Craft Info */}
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-5 w-5 text-industrial-graphite-500 mt-0.5" />
                      <div>
                        <p className="font-body text-sm font-medium text-industrial-graphite-600">
                          {notification.craft.worker_count} {notification.craft.trade.name}
                          {notification.craft.worker_count > 1 ? 's' : ''}
                        </p>
                        <p className="font-body text-xs text-industrial-graphite-400">
                          {notification.craft.experience_level}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-industrial-graphite-500 mt-0.5" />
                      <div>
                        <p className="font-body text-sm font-medium text-industrial-graphite-600">
                          {notification.craft.region.name}
                        </p>
                        <p className="font-body text-xs text-industrial-graphite-400">
                          {notification.craft.region.state_code}
                        </p>
                      </div>
                    </div>

                    {/* Start Date */}
                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-industrial-graphite-500 mt-0.5" />
                      <div>
                        <p className="font-body text-sm font-medium text-industrial-graphite-600">
                          {formatDate(notification.craft.start_date)}
                        </p>
                        <p className="font-body text-xs text-industrial-graphite-400">
                          {notification.craft.duration_days} days
                        </p>
                      </div>
                    </div>

                    {/* Pay Rate */}
                    <div className="flex items-start gap-2">
                      <Users className="h-5 w-5 text-industrial-graphite-500 mt-0.5" />
                      <div>
                        <p className="font-body text-sm font-medium text-industrial-graphite-600">
                          {getPayRateDisplay(notification)}
                        </p>
                        <p className="font-body text-xs text-industrial-graphite-400">
                          {notification.craft.hours_per_week} hrs/week
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-industrial-graphite-200">
                    <p className="font-body text-sm text-industrial-graphite-400">
                      Received {formatDate(notification.created_at)}
                    </p>
                    <Button variant="outline" size="sm" className="font-body">
                      View Details →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
