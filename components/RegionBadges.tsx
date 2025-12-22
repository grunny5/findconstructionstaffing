'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  variant?: 'default' | 'secondary' | 'outline';
  showViewAll?: boolean;
  className?: string;
}

export function RegionBadges({
  regions,
  maxDisplay = 5,
  variant = 'secondary',
  showViewAll = false,
  className = '',
}: RegionBadgesProps) {
  const [showAll, setShowAll] = useState(false);

  // Nationwide detection
  if (isNationwide(regions)) {
    return (
      <Badge variant="default" className={className}>
        Nationwide
      </Badge>
    );
  }

  const displayedRegions = showAll ? regions : regions.slice(0, maxDisplay);
  const hasMore = regions.length > maxDisplay;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayedRegions.map((region) => (
        <Link key={region.id} href={generateStateFilterUrl(region.code)}>
          <Badge variant={variant} className="cursor-pointer hover:opacity-80">
            {region.code}
          </Badge>
        </Link>
      ))}
      {hasMore && !showAll && (
        <>
          <Badge variant="outline" className="text-muted-foreground">
            +{regions.length - maxDisplay} more
          </Badge>
          {showViewAll && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowAll(true)}
              className="h-auto p-0 text-xs"
            >
              View All
            </Button>
          )}
        </>
      )}
    </div>
  );
}
