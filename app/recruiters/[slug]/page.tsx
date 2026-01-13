import { notFound } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { RegionBadges } from '@/components/RegionBadges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dbQueryWithTimeout, TIMEOUT_CONFIG } from '@/lib/fetch/timeout';
import { supabase } from '@/lib/supabase';
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
import {
  Agency,
  RawAgencyQueryResult,
  SupabaseAgencyTrade,
  SupabaseAgencyRegion,
  toComplianceItem,
} from '@/types/api';
import { SendMessageButton } from '@/components/messages/SendMessageButton';
import { ComplianceBadges } from '@/components/compliance/ComplianceBadges';
import Link from 'next/link';

interface PageProps {
  params: {
    slug: string;
  };
}

// Enable ISR: Revalidate cached page every 60 seconds
export const revalidate = 60;

// This is a server component - data fetching happens at request time
// Queries Supabase directly instead of internal API call to avoid serverless timeout
export default async function AgencyProfilePage({ params }: PageProps) {
  // Fetch agency with all related data in a single query
  // Direct database query avoids serverless function timeout issues
  // Uses aliases (trades:, regions:, compliance:) to match expected property names
  const { data: agency, error } = await dbQueryWithTimeout<RawAgencyQueryResult>(
    async () =>
      supabase
        .from('agencies')
        .select(
          `
          *,
          trades:agency_trades (
            trade:trades (
              id,
              name,
              slug
            )
          ),
          regions:agency_regions (
            region:regions (
              id,
              name,
              state_code,
              slug
            )
          ),
          compliance:agency_compliance (
            id,
            agency_id,
            compliance_type,
            is_active,
            is_verified,
            expiration_date
          )
        `
        )
        .eq('slug', params.slug)
        .eq('is_active', true)
        .single(),
    {
      retries: 3,
      retryDelay: 1000,
      totalTimeout: TIMEOUT_CONFIG.DB_RETRY_TOTAL,
    }
  );

  // Handle errors
  if (error) {
    console.error('[Agency Detail Page] Database query failed:', {
      slug: params.slug,
      error: error.message,
      code: error.code,
    });

    // PGRST116 means no rows found (404)
    if (error.code === 'PGRST116' || !agency) {
      notFound();
    }

    // Other errors trigger error boundary
    throw new Error(`Failed to load agency: ${error.message}`);
  }

  if (!agency) {
    notFound();
  }

  // Transform nested Supabase response to flat structure expected by component
  const transformedAgency: Agency = {
    ...agency,
    trades: agency.trades?.map((t: SupabaseAgencyTrade) => t.trade) || [],
    regions: agency.regions?.map((r: SupabaseAgencyRegion) => ({
      ...r.region,
      code: r.region.state_code
    })) || [],
    compliance: agency.compliance?.map(toComplianceItem) || []
  };

  return (
    <div className="min-h-screen bg-industrial-bg-primary">
      <Header />

      {/* Hero Section - Industrial Design System */}
      <section className="bg-industrial-bg-card border-b border-industrial-graphite-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Logo and Basic Info */}
            <div className="flex-shrink-0">
              {transformedAgency.logo_url ? (
                <Image
                  src={transformedAgency.logo_url}
                  alt={`${transformedAgency.name} logo`}
                  width={128}
                  height={128}
                  className="rounded-industrial-sharp object-cover border-2 border-industrial-graphite-200"
                />
              ) : (
                <div className="w-32 h-32 bg-industrial-graphite-100 rounded-industrial-sharp flex items-center justify-center border-2 border-industrial-graphite-200">
                  <Building2 className="h-12 w-12 text-industrial-graphite-400" />
                </div>
              )}
            </div>

            {/* Agency Details */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div>
                  {/* Industrial Typography: Bebas Neue, 2.5rem+, uppercase */}
                  <h1 className="font-display text-4xl lg:text-5xl text-industrial-graphite-600 uppercase tracking-wide mb-3">
                    {transformedAgency.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {transformedAgency.verified && (
                      <Badge variant="graphite">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {transformedAgency.featured && (
                      <Badge variant="orange">
                        <Award className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {transformedAgency.is_claimed && (
                      <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        Claimed
                      </Badge>
                    )}
                  </div>
                  <p className="font-body text-industrial-graphite-400 text-lg max-w-3xl">
                    {transformedAgency.description ||
                      'Professional construction staffing services.'}
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-3">
                  <Button size="lg" className="min-w-[200px]">
                    Request Workers
                  </Button>
                  {transformedAgency.website && (
                    <Button variant="outline" size="lg" asChild>
                      <a
                        href={transformedAgency.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit Website
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <SendMessageButton
                    agencyId={transformedAgency.id}
                    agencyName={transformedAgency.name}
                    agencySlug={transformedAgency.slug}
                    isClaimed={transformedAgency.is_claimed}
                  />
                  {!transformedAgency.is_claimed && (
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

              {/* Quick Stats - Industrial styling */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8 pt-8 border-t border-industrial-graphite-200">
                <div>
                  <div className="flex items-center gap-2 text-industrial-graphite-400 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="font-body text-sm uppercase tracking-wide">
                      Established
                    </span>
                  </div>
                  <p className="font-display text-3xl text-industrial-graphite-600">
                    {transformedAgency.founded_year || 'N/A'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-industrial-graphite-400 mb-1">
                    <Users className="h-4 w-4" />
                    <span className="font-body text-sm uppercase tracking-wide">
                      Company Size
                    </span>
                  </div>
                  <p className="font-display text-3xl text-industrial-graphite-600">
                    {transformedAgency.employee_count || 'N/A'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-industrial-graphite-400 mb-1">
                    <Star className="h-4 w-4" />
                    <span className="font-body text-sm uppercase tracking-wide">
                      Rating
                    </span>
                  </div>
                  <p className="font-display text-3xl text-industrial-graphite-600">
                    {transformedAgency.rating ? `${transformedAgency.rating}/5` : 'N/A'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-industrial-graphite-400 mb-1">
                    <Briefcase className="h-4 w-4" />
                    <span className="font-body text-sm uppercase tracking-wide">
                      Projects
                    </span>
                  </div>
                  <p className="font-display text-3xl text-industrial-graphite-600">
                    {transformedAgency.project_count || 0}+
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - Industrial Design System */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1 bg-industrial-graphite-100 rounded-industrial-sharp p-1">
                <TabsTrigger
                  value="overview"
                  className="font-body uppercase tracking-wide text-xs sm:text-sm data-[state=active]:bg-industrial-bg-card data-[state=active]:text-industrial-graphite-600 rounded-industrial-sharp"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="trades"
                  className="font-body uppercase tracking-wide text-xs sm:text-sm data-[state=active]:bg-industrial-bg-card data-[state=active]:text-industrial-graphite-600 rounded-industrial-sharp"
                >
                  <span className="sm:hidden">Trades</span>
                  <span className="hidden sm:inline">Trade Specialties</span>
                </TabsTrigger>
                <TabsTrigger
                  value="regions"
                  className="font-body uppercase tracking-wide text-xs sm:text-sm data-[state=active]:bg-industrial-bg-card data-[state=active]:text-industrial-graphite-600 rounded-industrial-sharp"
                >
                  <span className="sm:hidden">Areas</span>
                  <span className="hidden sm:inline">Service Areas</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card className="bg-industrial-bg-card border-industrial-graphite-200 rounded-industrial-sharp shadow-sm">
                  <CardContent className="p-6">
                    {/* Section header: Bebas Neue, 2rem, uppercase */}
                    <h2 className="font-display text-2xl text-industrial-graphite-600 uppercase tracking-wide mb-4 pb-3 border-b border-industrial-graphite-200">
                      About {transformedAgency.name}
                    </h2>
                    <p className="font-body text-industrial-graphite-500 mb-6">
                      {transformedAgency.description ||
                        'Professional construction staffing services specializing in skilled trades placement.'}
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-industrial-graphite-400" />
                        <span className="font-body text-industrial-graphite-600">
                          {transformedAgency.headquarters || 'United States'}
                        </span>
                      </div>

                      {transformedAgency.offers_per_diem !== null && (
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-industrial-graphite-400" />
                          <span className="font-body text-industrial-graphite-600">
                            {transformedAgency.offers_per_diem
                              ? 'Offers Per Diem'
                              : 'No Per Diem'}
                          </span>
                        </div>
                      )}

                      {transformedAgency.is_union !== null && (
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-industrial-graphite-400" />
                          <span className="font-body text-industrial-graphite-600">
                            {transformedAgency.is_union ? 'Union Partner' : 'Non-Union'}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trades" className="mt-6">
                <Card className="bg-industrial-bg-card border-industrial-graphite-200 rounded-industrial-sharp shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="font-display text-2xl text-industrial-graphite-600 uppercase tracking-wide mb-4 pb-3 border-b border-industrial-graphite-200">
                      Specializations
                    </h2>
                    {transformedAgency.trades && transformedAgency.trades.length > 0 ? (
                      <div className="space-y-6">
                        {/* Featured Trades (Top 3) */}
                        <div>
                          <h3 className="font-body text-sm font-semibold uppercase tracking-wide text-industrial-graphite-400 mb-3">
                            Featured Specialties
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {transformedAgency.trades.slice(0, 3).map((trade) => (
                              <Link
                                key={trade.id}
                                href={`/?trade=${encodeURIComponent(trade.name)}`}
                                className="inline-block"
                              >
                                <Badge
                                  variant="orange"
                                  className="text-base px-4 py-2 cursor-pointer"
                                >
                                  <Star className="h-4 w-4 mr-2 fill-current" />
                                  {trade.name}
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Additional Trades (if more than 3) */}
                        {transformedAgency.trades.length > 3 && (
                          <div>
                            <h3 className="font-body text-sm font-semibold uppercase tracking-wide text-industrial-graphite-400 mb-3">
                              Additional Specialties
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {transformedAgency.trades.slice(3).map((trade) => (
                                <Link
                                  key={trade.id}
                                  href={`/?trade=${encodeURIComponent(trade.name)}`}
                                  className="inline-block"
                                >
                                  <Badge
                                    variant="secondary"
                                    className="cursor-pointer"
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
                      <p className="font-body text-industrial-graphite-400">
                        No trade specialties listed.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="regions" className="mt-6">
                <Card className="bg-industrial-bg-card border-industrial-graphite-200 rounded-industrial-sharp shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="font-display text-2xl text-industrial-graphite-600 uppercase tracking-wide mb-4 pb-3 border-b border-industrial-graphite-200">
                      Service Areas
                    </h2>
                    {transformedAgency.regions && transformedAgency.regions.length > 0 ? (
                      <RegionBadges
                        regions={transformedAgency.regions}
                        maxDisplay={5}
                        variant="secondary"
                        showViewAll={true}
                      />
                    ) : (
                      <p className="font-body text-industrial-graphite-400">
                        No service areas listed.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Contact Info & Compliance */}
          <div className="space-y-6">
            {/* Compliance & Certifications Section */}
            {transformedAgency.compliance && transformedAgency.compliance.length > 0 && (
              <Card className="bg-industrial-bg-card border-industrial-graphite-200 rounded-industrial-sharp shadow-sm">
                <CardContent className="p-6">
                  <h2 className="font-display text-2xl text-industrial-graphite-600 uppercase tracking-wide mb-4 pb-3 border-b border-industrial-graphite-200">
                    Compliance & Certifications
                  </h2>
                  <ComplianceBadges compliance={transformedAgency.compliance} />
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card className="bg-industrial-bg-card border-industrial-graphite-200 rounded-industrial-sharp shadow-sm">
              <CardContent className="p-6">
                <h2 className="font-display text-2xl text-industrial-graphite-600 uppercase tracking-wide mb-4 pb-3 border-b border-industrial-graphite-200">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  {transformedAgency.phone && (
                    <div>
                      <div className="flex items-center gap-2 text-industrial-graphite-400 mb-1">
                        <Phone className="h-4 w-4" />
                        <span className="font-body text-sm uppercase tracking-wide">
                          Phone
                        </span>
                      </div>
                      <a
                        href={`tel:${transformedAgency.phone}`}
                        className="font-body text-industrial-orange hover:text-industrial-orange-500 transition-colors"
                      >
                        {transformedAgency.phone}
                      </a>
                    </div>
                  )}

                  {transformedAgency.email && (
                    <div>
                      <div className="flex items-center gap-2 text-industrial-graphite-400 mb-1">
                        <Mail className="h-4 w-4" />
                        <span className="font-body text-sm uppercase tracking-wide">
                          Email
                        </span>
                      </div>
                      <a
                        href={`mailto:${transformedAgency.email}`}
                        className="font-body text-industrial-orange hover:text-industrial-orange-500 transition-colors"
                      >
                        {transformedAgency.email}
                      </a>
                    </div>
                  )}

                  {transformedAgency.website && (
                    <div>
                      <div className="flex items-center gap-2 text-industrial-graphite-400 mb-1">
                        <Globe className="h-4 w-4" />
                        <span className="font-body text-sm uppercase tracking-wide">
                          Website
                        </span>
                      </div>
                      <a
                        href={transformedAgency.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-body text-industrial-orange hover:text-industrial-orange-500 transition-colors flex items-center gap-1"
                      >
                        Visit Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-industrial-graphite-200">
                  <Button className="w-full" size="lg">
                    Request Workers
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Back to Directory */}
            <Card className="bg-industrial-bg-card border-industrial-graphite-200 rounded-industrial-sharp shadow-sm">
              <CardContent className="p-6">
                <Link
                  href="/"
                  className="flex items-center gap-2 font-body text-industrial-orange hover:text-industrial-orange-500 transition-colors"
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
