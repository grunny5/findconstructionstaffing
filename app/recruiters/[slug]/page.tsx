import { notFound } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Calendar,
  Users,
  Award,
  Star,
  ExternalLink,
  CheckCircle,
  Briefcase,
  DollarSign,
  Shield,
} from 'lucide-react';
import { Agency, AgencyResponse, isErrorResponse } from '@/types/api';
import Link from 'next/link';

interface PageProps {
  params: {
    slug: string;
  };
}

// This is a server component - data fetching happens at request time
export default async function AgencyProfilePage({ params }: PageProps) {
  // Fetch agency data from API
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/agencies/${params.slug}`,
    {
      cache: 'no-store', // Ensure fresh data
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      notFound();
    }
    // For other errors, throw to trigger error boundary
    throw new Error('Failed to fetch agency data');
  }

  const data: AgencyResponse = await response.json();
  const agency = data.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Logo and Basic Info */}
            <div className="flex-shrink-0">
              {agency.logo_url ? (
                <Image
                  src={agency.logo_url}
                  alt={`${agency.name} logo`}
                  width={128}
                  height={128}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Agency Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {agency.name}
                  </h1>
                  <div className="flex items-center gap-4 mb-4">
                    {agency.verified && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {agency.featured && (
                      <Badge variant="default" className="bg-orange-600">
                        <Award className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {agency.is_claimed && (
                      <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        Claimed
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 text-lg max-w-3xl">
                    {agency.description ||
                      'Professional construction staffing services.'}
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-3">
                  <Button size="lg" className="min-w-[200px]">
                    Request Workers
                  </Button>
                  {agency.website && (
                    <Button variant="outline" size="lg" asChild>
                      <a
                        href={agency.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit Website
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {!agency.is_claimed && (
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className="min-w-[200px]"
                    >
                      <Link href={`/claim/${params.slug}`}>
                        <Shield className="mr-2 h-4 w-4" />
                        Claim This Agency
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Established</span>
                  </div>
                  <p className="text-2xl font-semibold">
                    {agency.founded_year || 'N/A'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Company Size</span>
                  </div>
                  <p className="text-2xl font-semibold">
                    {agency.employee_count || 'N/A'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Star className="h-4 w-4" />
                    <span className="text-sm">Rating</span>
                  </div>
                  <p className="text-2xl font-semibold">
                    {agency.rating ? `${agency.rating}/5` : 'N/A'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-sm">Projects</span>
                  </div>
                  <p className="text-2xl font-semibold">
                    {agency.project_count || 0}+
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="trades">Trade Specialties</TabsTrigger>
                <TabsTrigger value="regions">Service Areas</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      About {agency.name}
                    </h2>
                    <p className="text-gray-600 mb-6">
                      {agency.description ||
                        'Professional construction staffing services specializing in skilled trades placement.'}
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <span>{agency.headquarters || 'United States'}</span>
                      </div>

                      {agency.offers_per_diem !== null && (
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-gray-400" />
                          <span>
                            {agency.offers_per_diem
                              ? 'Offers Per Diem'
                              : 'No Per Diem'}
                          </span>
                        </div>
                      )}

                      {agency.is_union !== null && (
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-gray-400" />
                          <span>
                            {agency.is_union ? 'Union Partner' : 'Non-Union'}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trades" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Specializations
                    </h2>
                    {agency.trades && agency.trades.length > 0 ? (
                      <div className="space-y-6">
                        {/* Featured Trades (Top 3) */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-600 mb-3">
                            Featured Specialties
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {agency.trades.slice(0, 3).map((trade) => (
                              <Link
                                key={trade.id}
                                href={`/?trade=${encodeURIComponent(trade.name)}`}
                                className="inline-block"
                              >
                                <Badge
                                  variant="default"
                                  className="text-base px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                                >
                                  <Star className="h-4 w-4 mr-2 fill-current" />
                                  {trade.name}
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Additional Trades (if more than 3) */}
                        {agency.trades.length > 3 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-600 mb-3">
                              Additional Specialties
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {agency.trades.slice(3).map((trade) => (
                                <Link
                                  key={trade.id}
                                  href={`/?trade=${encodeURIComponent(trade.name)}`}
                                  className="inline-block"
                                >
                                  <Badge
                                    variant="secondary"
                                    className="text-sm hover:bg-secondary/80 transition-colors cursor-pointer"
                                  >
                                    {trade.name}
                                  </Badge>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        No trade specialties listed.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="regions" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Service Areas
                    </h2>
                    {agency.regions && agency.regions.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {agency.regions.map((region) => (
                          <div
                            key={region.id}
                            className="flex items-center gap-2"
                          >
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>
                              {region.name}, {region.code}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No service areas listed.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  {agency.phone && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">Phone</span>
                      </div>
                      <a
                        href={`tel:${agency.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {agency.phone}
                      </a>
                    </div>
                  )}

                  {agency.email && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">Email</span>
                      </div>
                      <a
                        href={`mailto:${agency.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {agency.email}
                      </a>
                    </div>
                  )}

                  {agency.website && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Globe className="h-4 w-4" />
                        <span className="text-sm">Website</span>
                      </div>
                      <a
                        href={agency.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Visit Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <Button className="w-full" size="lg">
                    Request Workers
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Back to Directory */}
            <Card>
              <CardContent className="p-6">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  ← Back to Directory
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
