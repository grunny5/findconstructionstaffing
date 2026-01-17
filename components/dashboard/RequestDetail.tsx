'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    additional_details?: string | null;
    created_at: string;
  };
}

interface RequestDetailProps {
  notification: Notification;
  agencySlug: string;
  notificationId: string;
}

export function RequestDetail({
  notification: initialNotification,
  agencySlug,
  notificationId,
}: RequestDetailProps) {
  const router = useRouter();
  const [notification, setNotification] = useState(initialNotification);
  const [responding, setResponding] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  // Mark as viewed on mount
  useEffect(() => {
    const markAsViewed = async () => {
      try {
        await fetch(`/api/labor-requests/notifications/${notificationId}/view`, {
          method: 'POST',
        });
        // Refresh the notification status
        // Note: In production, you might want to refetch the notification here
        // For now, we'll just update the viewed_at timestamp locally
        if (!notification.viewed_at) {
          setNotification((prev) => ({
            ...prev,
            viewed_at: new Date().toISOString(),
            status: 'viewed',
          }));
        }
      } catch (error) {
        console.error('Error marking as viewed:', error);
      }
    };

    markAsViewed();
  }, [notificationId, notification.viewed_at]);

  const handleRespond = async (interested: boolean) => {
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

      // Update local state to show responded status
      setNotification((prev) => ({
        ...prev,
        status: 'responded',
        responded_at: new Date().toISOString(),
      }));

      // Optional: Show success message
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

  const getPayRateDisplay = () => {
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

  const hasResponded = notification.status === 'responded';

  return (
    <>
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/dashboard/agency/${agencySlug}/requests`)}
        className="mb-6 font-body"
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
                <CardTitle className="font-display text-2xl uppercase tracking-wide">
                  {notification.labor_request.project_name}
                </CardTitle>
                <Badge variant={hasResponded ? 'outline' : 'default'}>
                  {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                </Badge>
              </div>
              <CardDescription className="font-body text-base">
                {notification.labor_request.company_name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Craft Requirements */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2 uppercase tracking-wide">
            <Briefcase className="h-5 w-5" />
            Position Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trade */}
            <div>
              <p className="font-body text-sm text-industrial-graphite-400 mb-1">Trade</p>
              <p className="font-body font-semibold text-industrial-graphite-600">
                {notification.craft.worker_count} {notification.craft.trade.name}
                {notification.craft.worker_count > 1 ? 's' : ''}
              </p>
            </div>

            {/* Experience Level */}
            <div>
              <p className="font-body text-sm text-industrial-graphite-400 mb-1">Experience Level</p>
              <p className="font-body font-semibold text-industrial-graphite-600">
                {notification.craft.experience_level}
              </p>
            </div>

            {/* Location */}
            <div>
              <p className="font-body text-sm text-industrial-graphite-400 mb-1">Location</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-industrial-graphite-500" />
                <p className="font-body font-semibold text-industrial-graphite-600">
                  {notification.craft.region.name}, {notification.craft.region.state_code}
                </p>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <p className="font-body text-sm text-industrial-graphite-400 mb-1">Start Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-industrial-graphite-500" />
                <p className="font-body font-semibold text-industrial-graphite-600">
                  {formatDate(notification.craft.start_date)}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div>
              <p className="font-body text-sm text-industrial-graphite-400 mb-1">Duration</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-industrial-graphite-500" />
                <p className="font-body font-semibold text-industrial-graphite-600">
                  {notification.craft.duration_days} days
                </p>
              </div>
            </div>

            {/* Hours per Week */}
            <div>
              <p className="font-body text-sm text-industrial-graphite-400 mb-1">Hours per Week</p>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-industrial-graphite-500" />
                <p className="font-body font-semibold text-industrial-graphite-600">
                  {notification.craft.hours_per_week} hours
                </p>
              </div>
            </div>

            {/* Pay Rate */}
            <div>
              <p className="font-body text-sm text-industrial-graphite-400 mb-1">Pay Rate</p>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-industrial-graphite-500" />
                <p className="font-body font-semibold text-industrial-graphite-600">
                  {getPayRateDisplay()}
                </p>
              </div>
            </div>

            {/* Per Diem */}
            {notification.craft.per_diem_rate && (
              <div>
                <p className="font-body text-sm text-industrial-graphite-400 mb-1">Per Diem</p>
                <p className="font-body font-semibold text-industrial-graphite-600">
                  ${notification.craft.per_diem_rate}/day
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {notification.craft.notes && (
            <div className="pt-4 border-t border-industrial-graphite-200">
              <p className="font-body text-sm text-industrial-graphite-400 mb-1">Additional Notes</p>
              <p className="font-body text-industrial-graphite-600">{notification.craft.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-display uppercase tracking-wide">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-industrial-graphite-500" />
            <div>
              <p className="font-body text-sm text-industrial-graphite-400">Email</p>
              <a
                href={`mailto:${notification.labor_request.contact_email}`}
                className="font-body font-medium text-industrial-burnt-500 hover:underline"
              >
                {notification.labor_request.contact_email}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-industrial-graphite-500" />
            <div>
              <p className="font-body text-sm text-industrial-graphite-400">Phone</p>
              <a
                href={`tel:${notification.labor_request.contact_phone}`}
                className="font-body font-medium text-industrial-burnt-500 hover:underline"
              >
                {notification.labor_request.contact_phone}
              </a>
            </div>
          </div>

          {notification.labor_request.additional_details && (
            <div className="pt-3 border-t border-industrial-graphite-200">
              <p className="font-body text-sm text-industrial-graphite-400 mb-1">Additional Details</p>
              <p className="font-body text-industrial-graphite-600 whitespace-pre-wrap">
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
            <CardTitle className="font-display uppercase tracking-wide">Respond to Request</CardTitle>
            <CardDescription className="font-body">
              Let the contractor know if you&apos;re interested in this opportunity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="responseMessage"
                className="font-body text-sm font-medium text-industrial-graphite-600 mb-2 block"
              >
                Message to Contractor (optional)
              </label>
              <Textarea
                id="responseMessage"
                placeholder="Include any questions or additional information..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={4}
                className="w-full font-body"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleRespond(true)}
                disabled={responding}
                className="flex-1 bg-green-600 hover:bg-green-700 font-body"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                I&apos;m Interested
              </Button>

              <Button
                onClick={() => handleRespond(false)}
                disabled={responding}
                variant="outline"
                className="flex-1 font-body"
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
                <p className="font-body font-semibold text-green-900">Response Submitted</p>
                <p className="font-body text-sm text-green-700">
                  You responded to this request on{' '}
                  {notification.responded_at && formatDate(notification.responded_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
