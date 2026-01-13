'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RegionBadges } from '@/components/RegionBadges';
import { ComplianceBadges } from '@/components/compliance/ComplianceBadges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MapPin,
  Users,
  Phone,
  Mail,
  DollarSign,
  Building2,
  Star,
  ArrowUpRight,
  BadgeCheck,
} from 'lucide-react';
import type { Region, ComplianceItem } from '@/types/api';

interface AgencyCardProps {
  agency: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    website?: string;
    phone?: string;
    email?: string;
    is_claimed: boolean;
    offers_per_diem: boolean;
    is_union: boolean;
    trades?: string[];
    regions?: Region[];
    compliance?: ComplianceItem[];
    rating?: number;
    reviewCount?: number;
    projectCount?: number;
    founded_year?: number;
    employee_count?: string;
    headquarters?: string;
    verified?: boolean;
    featured?: boolean;
    profile_completion_percentage?: number;
  };
}

// Gradient color classes for agency logos
const gradientColors = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-purple-500',
  'from-amber-500 to-orange-500',
];

// Industrial Design: Category color mapping based on primary trade
const getCategoryBorderColor = (trades?: string[]): string => {
  if (!trades || trades.length === 0) return 'border-l-industrial-graphite-400';

  const primaryTrade = trades[0].toLowerCase();

  // Welding/Fabrication trades → Orange
  if (
    primaryTrade.includes('weld') ||
    primaryTrade.includes('fabricat') ||
    primaryTrade.includes('steel') ||
    primaryTrade.includes('iron')
  ) {
    return 'border-l-industrial-orange';
  }

  // Electrical trades → Navy
  if (
    primaryTrade.includes('electric') ||
    primaryTrade.includes('power') ||
    primaryTrade.includes('lineman')
  ) {
    return 'border-l-industrial-navy';
  }

  // Mechanical/Maintenance/General → Graphite
  return 'border-l-industrial-graphite-400';
};

export default function AgencyCard({ agency }: AgencyCardProps) {
  const [imageError, setImageError] = useState(false);

  // Get a consistent gradient color based on agency name
  const gradientIndex = agency.name.length % gradientColors.length;
  const gradientClass = gradientColors[gradientIndex];

  // Generate agency initials for logo fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Mock contact info for display
  const displayPhone = agency.phone || '(303) 555-0123';
  const displayEmail =
    agency.email ||
    'contact@' + agency.name.toLowerCase().replace(/\s+/g, '') + '.com';

  // Determine which badges to show
  const showVerifiedBadge = agency.verified === true; // Verified agency status
  const showFeaturedBadge = agency.profile_completion_percentage === 100; // 100% profile completion

  // Get category border color based on primary trade
  const categoryBorderColor = getCategoryBorderColor(agency.trades);

  return (
    <Card
      className={`group bg-industrial-bg-card border border-industrial-graphite-200 border-l-[4px] ${categoryBorderColor} rounded-industrial-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 relative`}
    >
      {/* Featured Badge - Top Right */}
      {showFeaturedBadge && (
        <div className="absolute top-4 right-4 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg shadow-amber-500/30">
                  <Star className="h-4 w-4 fill-current" />
                  Featured Agency
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Complete profile with priority placement in search results
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Industrial Logo */}
          <div className="flex-shrink-0">
            {agency.logo_url && !imageError ? (
              <div className="w-16 h-16 relative rounded-industrial-base overflow-hidden border-2 border-industrial-graphite-200">
                <Image
                  src={agency.logo_url}
                  alt={`${agency.name} logo`}
                  fill
                  sizes="(max-width: 768px) 64px, 64px"
                  className="object-cover"
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              </div>
            ) : (
              <div
                className={`w-16 h-16 bg-industrial-graphite-600 rounded-industrial-base flex items-center justify-center text-white font-display text-xl uppercase`}
              >
                {getInitials(agency.name)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1">
                {/* Header with name and founded year */}
                <div className="mb-4">
                  <h3 className="font-display text-2xl uppercase tracking-wide leading-tight text-industrial-graphite-600 flex items-center flex-wrap gap-2">
                    <Link
                      href={`/recruiters/${agency.slug}`}
                      className="hover:text-industrial-orange transition-colors duration-200"
                      prefetch={true}
                      aria-label={`View ${agency.name} profile`}
                    >
                      {agency.name}
                    </Link>
                    {showVerifiedBadge && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center">
                              <BadgeCheck
                                className="h-5 w-5 text-industrial-orange"
                                strokeWidth={2.5}
                                aria-label="Verified Profile"
                              />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs font-body text-sm">
                              Verified Agency: This agency has been verified
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </h3>
                  {agency.founded_year && (
                    <p className="font-body text-xs text-industrial-graphite-400 mt-1">
                      Est. {agency.founded_year}
                    </p>
                  )}
                </div>

                {/* Badges Row */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  {/* Rating Badge */}
                  {agency.rating && (
                    <div className="flex items-center gap-1 bg-industrial-graphite-100 text-industrial-graphite-600 px-2.5 py-1 rounded-industrial-sharp">
                      <Star className="h-3.5 w-3.5 fill-industrial-orange text-industrial-orange" />
                      <span className="text-xs font-body font-semibold">
                        {agency.rating.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* Compliance Indicators */}
                  {agency.compliance && agency.compliance.length > 0 && (
                    <ComplianceBadges
                      compliance={agency.compliance}
                      variant="compact"
                    />
                  )}
                </div>

                {/* Description */}
                {agency.description && (
                  <p className="font-body text-sm text-industrial-graphite-500 mb-6 leading-relaxed">
                    {agency.description}
                  </p>
                )}

                {/* Company Stats Grid - Industrial */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {agency.headquarters && (
                    <div className="flex items-center gap-2 text-industrial-graphite-500">
                      <div className="w-8 h-8 bg-industrial-graphite-100 rounded-industrial-sharp flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-industrial-graphite-400" />
                      </div>
                      <span className="font-body text-sm font-medium">
                        {agency.headquarters}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-industrial-graphite-500">
                    <div className="w-8 h-8 bg-industrial-graphite-100 rounded-industrial-sharp flex items-center justify-center">
                      <Users className="h-4 w-4 text-industrial-graphite-400" />
                    </div>
                    <span className="font-body text-sm font-medium">
                      {agency.employee_count || '500+'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-industrial-graphite-500">
                    <div className="w-8 h-8 bg-industrial-graphite-100 rounded-industrial-sharp flex items-center justify-center">
                      <Phone className="h-4 w-4 text-industrial-graphite-400" />
                    </div>
                    <span className="font-body text-sm font-medium">
                      {displayPhone}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-industrial-graphite-500">
                    <div className="w-8 h-8 bg-industrial-graphite-100 rounded-industrial-sharp flex items-center justify-center">
                      <Mail className="h-4 w-4 text-industrial-graphite-400" />
                    </div>
                    <span className="font-body text-sm font-medium truncate">
                      {displayEmail}
                    </span>
                  </div>
                </div>

                {/* Specialties - Featured Trades Display */}
                {agency.trades && agency.trades.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {agency.trades.slice(0, 3).map((trade, index) => (
                      <Link
                        key={index}
                        href={`/?trade=${encodeURIComponent(trade)}`}
                        className="inline-block"
                      >
                        <Badge
                          variant="default"
                          className="font-body text-xs font-semibold uppercase tracking-wide bg-industrial-graphite-600 text-white dark:bg-industrial-graphite-100 dark:text-industrial-graphite-600 hover:bg-industrial-graphite-500 dark:hover:bg-industrial-graphite-200 px-2.5 py-1 rounded-industrial-sharp transition-colors duration-200 cursor-pointer"
                        >
                          {trade}
                        </Badge>
                      </Link>
                    ))}
                    {agency.trades.length > 3 && (
                      <Badge
                        variant="secondary"
                        className="font-body text-xs font-semibold bg-industrial-graphite-100 text-industrial-graphite-500 dark:bg-industrial-graphite-200 dark:text-industrial-graphite-600 px-2.5 py-1 rounded-industrial-sharp"
                      >
                        +{agency.trades.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Service Regions */}
                {agency.regions && agency.regions.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="font-body text-xs uppercase tracking-wide text-industrial-graphite-400">
                      Serves:
                    </span>
                    <RegionBadges
                      regions={agency.regions}
                      maxDisplay={3}
                      variant="outline"
                      showViewAll={false}
                    />
                  </div>
                )}
              </div>

              {/* Industrial Action Buttons */}
              <div className="flex flex-col gap-3 lg:flex-shrink-0">
                <Button
                  variant="outline"
                  className="font-body text-xs font-semibold uppercase tracking-wide border-2 border-industrial-graphite-300 text-industrial-graphite-500 hover:border-industrial-graphite-600 hover:text-industrial-graphite-600 rounded-industrial-sharp w-full lg:w-36 transition-all duration-200"
                  asChild
                >
                  <Link
                    href={`/recruiters/${agency.slug}`}
                    prefetch={true}
                    aria-label={`View ${agency.name} full profile`}
                  >
                    View Profile
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  className="font-body text-xs font-semibold uppercase tracking-wide bg-industrial-orange text-white hover:bg-industrial-orange-500 rounded-industrial-sharp w-full lg:w-36 transition-all duration-200"
                  asChild
                >
                  <Link href={`/request-labor?agency=${agency.slug}`}>
                    Contact Now
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
