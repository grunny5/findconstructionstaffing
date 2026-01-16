'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  MapPin,
  Users,
  Phone,
  Mail,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { InboxNotification } from '@/types/labor-request';

// TODO: Replace with actual agency ID from authentication
const MOCK_AGENCY_ID = 'agency-1';

export default function LaborRequestDetailPage({
  params,
}: {
  params: { requestId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notificationId = searchParams.get('notificationId');

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<InboxNotification | null>(null);
  const [responding, setResponding] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    if (!notificationId) {
      setLoading(false);
      return;
    }

    fetchNotificationDetails();
    markAsViewed();
  }, [notificationId]);

  const fetchNotificationDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/agencies/${MOCK_AGENCY_ID}/labor-requests`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch labor requests');
      }

      const data = await response.json();
      const foundNotification = data.notifications.find(
        (n: InboxNotification) => n.id === notificationId
      );

      if (foundNotification) {
        setNotification(foundNotification);
      }
    } catch (error) {
      console.error('Error fetching notification details:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async () => {
    if (!notificationId) return;

    try {
      await fetch(
        `/api/labor-requests/notifications/${notificationId}/view`,
        { method: 'POST' }
      );
    } catch (error) {
      console.error('Error marking as viewed:', error);
    }
  };

  const handleRespond = async (interested: boolean) => {
    if (!notificationId) return;

    setResponding(true);
    try {
      const response = await fetch(
        `/api/labor-requests/notifications/${notificationId}/respond`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interested,
            message: responseMessage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      // Refresh notification to show updated status
      await fetchNotificationDetails();

      // Show success message (you might want to use a toast library)
      alert(`Response submitted: ${interested ? 'Interested' : 'Not interested'}`);
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  const formatDate = (isoDate: string) => {
    // Handle date-only strings (YYYY-MM-DD) to avoid timezone shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      const [year, month, day] = isoDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    // Handle full ISO timestamps
    return new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPayRateDisplay = (notification: InboxNotification) => {
    const { pay_rate_min, pay_rate_max } = notification.craft;
    if (pay_rate_min && pay_rate_max) {
      return `$${pay_rate_min}-$${pay_rate_max}/hr`;
    }
    if (pay_rate_min) {
      return `$${pay_rate_min}+/hr`;
    }
    return 'Rate negotiable';
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Not found state
  if (!notification) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/labor-requests')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inbox
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Labor request not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasResponded = notification.status === 'responded';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/labor-requests')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Inbox
      </Button>

      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">
                  {notification.labor_request.project_name}
                </CardTitle>
                <Badge variant={hasResponded ? 'outline' : 'default'}>
                  {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                </Badge>
              </div>
              <CardDescription className="text-base">
                {notification.labor_request.company_name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Craft Requirements */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Position Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trade */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Trade</p>
              <p className="font-semibold text-gray-900">
                {notification.craft.worker_count} {notification.craft.trade.name}
                {notification.craft.worker_count > 1 ? 's' : ''}
              </p>
            </div>

            {/* Experience Level */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Experience Level</p>
              <p className="font-semibold text-gray-900">
                {notification.craft.experience_level}
              </p>
            </div>

            {/* Location */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Location</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <p className="font-semibold text-gray-900">
                  {notification.craft.region.name}, {notification.craft.region.state_code}
                </p>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Start Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <p className="font-semibold text-gray-900">
                  {formatDate(notification.craft.start_date)}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Duration</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="font-semibold text-gray-900">
                  {notification.craft.duration_days} days
                </p>
              </div>
            </div>

            {/* Hours per Week */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Hours per Week</p>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <p className="font-semibold text-gray-900">
                  {notification.craft.hours_per_week} hours
                </p>
              </div>
            </div>

            {/* Pay Rate */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Pay Rate</p>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <p className="font-semibold text-gray-900">
                  {getPayRateDisplay(notification)}
                </p>
              </div>
            </div>

            {/* Per Diem */}
            {notification.craft.per_diem_rate && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Per Diem</p>
                <p className="font-semibold text-gray-900">
                  ${notification.craft.per_diem_rate}/day
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {notification.craft.notes && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
              <p className="text-gray-900">{notification.craft.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <a
                href={`mailto:${notification.labor_request.contact_email}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {notification.labor_request.contact_email}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <a
                href={`tel:${notification.labor_request.contact_phone}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {notification.labor_request.contact_phone}
              </a>
            </div>
          </div>

          {notification.labor_request.additional_details && (
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-500 mb-1">Additional Details</p>
              <p className="text-gray-900 whitespace-pre-wrap">
                {notification.labor_request.additional_details}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Section */}
      {!hasResponded && (
        <Card>
          <CardHeader>
            <CardTitle>Respond to Request</CardTitle>
            <CardDescription>
              Let the contractor know if you're interested in this opportunity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Message to Contractor (optional)
              </label>
              <Textarea
                placeholder="Include any questions or additional information..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleRespond(true)}
                disabled={responding}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                I'm Interested
              </Button>

              <Button
                onClick={() => handleRespond(false)}
                disabled={responding}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Not Interested
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Already Responded */}
      {hasResponded && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">
                  Response Submitted
                </p>
                <p className="text-sm text-green-700">
                  You responded to this request on{' '}
                  {notification.responded_at && formatDate(notification.responded_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
