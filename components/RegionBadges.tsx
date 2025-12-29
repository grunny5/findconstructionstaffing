'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isNationwide, generateStateFilterUrl } from '@/lib/utils';

interface Region {
  id: string;
  name: string;
  code: string;
}

interface RegionBadgesProps {
  regions: Region[];
  maxDisplay?: number;
  /** Industrial badge variant for region styling */
  variant?: 'default' | 'secondary' | 'outline' | 'graphite';
  showViewAll?: boolean;
  className?: string;
  /** Show location icon on badges */
  showIcon?: boolean;
}

/**
 * RegionBadges Component
 *
 * Industrial Design System region badge display with:
 * - Consistent graphite styling for regions
 * - Flex-wrap layout for responsive stacking
 * - 8px gap spacing (--space-sm)
 * - Adequate touch spacing on mobile
 */
export function RegionBadges({
  regions,
  maxDisplay = 5,
  variant = 'secondary',
  showViewAll = false,
  className = '',
  showIcon = false,
}: RegionBadgesProps) {
  const [showAll, setShowAll] = useState(false);

  // Nationwide detection
  if (isNationwide(regions)) {
    return (
      <Badge
        variant="graphite"
        className={`${className}`}
        data-testid="nationwide-badge"
      >
        {showIcon && <MapPin className="h-3 w-3 mr-1" />}
        Nationwide
      </Badge>
    );
  }

  const displayedRegions = showAll ? regions : regions.slice(0, maxDisplay);
  const hasMore = regions.length > maxDisplay;

  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
      data-testid="region-badges-container"
    >
      {displayedRegions.map((region) => (
        <Link
          key={region.id}
          href={generateStateFilterUrl(region.code)}
          className="inline-block"
        >
          <Badge
            variant={variant}
            className="cursor-pointer transition-colors"
            data-testid={`region-badge-${region.code}`}
          >
            {showIcon && <MapPin className="h-3 w-3 mr-1" />}
            {region.code}
          </Badge>
        </Link>
      ))}
      {hasMore && !showAll && (
        <>
          <Badge
            variant="outline"
            className="text-industrial-graphite-400"
            data-testid="more-regions-badge"
          >
            +{regions.length - maxDisplay} more
          </Badge>
          {showViewAll && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowAll(true)}
              className="h-auto p-0 font-body text-xs text-industrial-orange hover:text-industrial-orange-500"
              data-testid="view-all-button"
            >
              View All
            </Button>
          )}
        </>
      )}
    </div>
  );
}
