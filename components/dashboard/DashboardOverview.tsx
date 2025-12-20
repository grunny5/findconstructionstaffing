import Link from 'next/link';
import {
  Eye,
  Mail,
  CheckCircle,
  Image,
  MapPin,
  HelpCircle,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { StatsCard } from './StatsCard';
import { ProfileCompletionWidget } from './ProfileCompletionWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  profile_completion_percentage: number;
  last_edited_at: string | null;
}

interface DashboardOverviewProps {
  agency: Agency;
  isLoading?: boolean;
}

export function DashboardOverview({
  agency,
  isLoading = false,
}: DashboardOverviewProps) {
  // Calculate missing fields for profile completion
  const getMissingFields = () => {
    const fields: string[] = [];
    if (!agency.logo_url) fields.push('Add company logo');
    if (!agency.description) fields.push('Add company description');
    if (agency.profile_completion_percentage < 100) {
      fields.push('Complete all profile fields');
    }
    return fields;
  };

  if (isLoading) {
    return <DashboardOverviewSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Profile Views"
          value={0}
          description="Last 30 days"
          icon={Eye}
        />
        <StatsCard
          title="Lead Requests"
          value={0}
          description="Coming soon"
          icon={Mail}
        />
        <StatsCard
          title="Profile Completion"
          value={`${agency.profile_completion_percentage}%`}
          description={
            agency.profile_completion_percentage === 100
              ? 'Fully optimized'
              : 'Improve visibility'
          }
          icon={CheckCircle}
        />
      </div>

      {/* Profile Completion and Quick Actions Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Profile Completion Widget - spans 1 column */}
        <div className="md:col-span-1">
          <ProfileCompletionWidget
            percentage={agency.profile_completion_percentage}
            missingFields={getMissingFields()}
          />
        </div>

        {/* Quick Actions - spans 2 columns */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Link href={`/dashboard/agency/${agency.slug}/profile`}>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Edit Profile</div>
                      <div className="text-xs text-muted-foreground">
                        Update company details
                      </div>
                    </div>
                  </div>
                </Button>
              </Link>

              <Link href={`/dashboard/agency/${agency.slug}/profile#logo`}>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Image className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">
                        {agency.logo_url ? 'Update Logo' : 'Add Logo'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {agency.logo_url
                          ? 'Change company logo'
                          : 'Upload company logo'}
                      </div>
                    </div>
                  </div>
                </Button>
              </Link>

              <Link href={`/dashboard/agency/${agency.slug}/services`}>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Update Services</div>
                      <div className="text-xs text-muted-foreground">
                        Trades & regions
                      </div>
                    </div>
                  </div>
                </Button>
              </Link>

              <Link href={`/recruiters/${agency.slug}`} target="_blank">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ExternalLink className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">View Public Profile</div>
                      <div className="text-xs text-muted-foreground">
                        See how clients see you
                      </div>
                    </div>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity and Help Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {agency.last_edited_at ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <div className="p-2 rounded-full bg-muted">
                    <CheckCircle className="h-3 w-3" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Profile updated</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(agency.last_edited_at).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent activity to display
              </p>
            )}
          </CardContent>
        </Card>

        {/* Need Help */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Get support with your profile or have questions about our
              platform.
            </p>
            <Link href="/help">
              <Button variant="outline" className="w-full">
                Visit Help Center
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="w-full">
                Contact Support
                <Mail className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profile Completion and Quick Actions Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-32 rounded-full mx-auto mb-4" />
            <Skeleton className="h-2 w-full mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Help Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { DashboardOverviewSkeleton };
