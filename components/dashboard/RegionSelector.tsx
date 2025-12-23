'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, MapPin } from 'lucide-react';
import { RegionSelectionModal } from './RegionSelectionModal';
import type { Region } from '@/types/supabase';
import { cn } from '@/lib/utils';

interface RegionSelectorProps {
  selectedRegions: Region[];
  onChange: (regions: Region[]) => void;
  disabled?: boolean;
}

/**
 * Region selection component for agency service area management
 *
 * Features:
 * - Display selected regions as chips/badges
 * - "Add Regions" button to open selection modal
 * - Remove individual regions via X button
 * - Modal with state checkboxes and quick-select regional buttons
 * - "Nationwide" indicator when all 50 states selected
 *
 * @param selectedRegions - Currently selected regions (US states)
 * @param onChange - Callback when regions are updated
 * @param disabled - Disable all interactions
 */
export function RegionSelector({
  selectedRegions,
  onChange,
  disabled = false,
}: RegionSelectorProps) {
  const [showModal, setShowModal] = useState(false);

  const handleRemoveRegion = (regionId: string) => {
    if (disabled) return;
    const updatedRegions = selectedRegions.filter((r) => r.id !== regionId);
    onChange(updatedRegions);
  };

  const handleSave = (regions: Region[]) => {
    onChange(regions);
  };

  // Check if all US states are selected (50 states total)
  const isNationwide = selectedRegions.length === 50;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">
            Service Regions{' '}
            <span className="text-muted-foreground">
              ({selectedRegions.length} state
              {selectedRegions.length !== 1 ? 's' : ''})
            </span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Select the US states where your agency provides staffing services.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowModal(true)}
          disabled={disabled}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {selectedRegions.length === 0 ? 'Add Regions' : 'Edit Regions'}
        </Button>
      </div>

      {/* Selected Regions Display */}
      {selectedRegions.length === 0 ? (
        <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-md bg-muted/30">
          <p className="text-sm text-muted-foreground">
            No service regions selected. Click &ldquo;Add Regions&rdquo; to get
            started.
          </p>
        </div>
      ) : (
        <>
          {/* Nationwide Badge */}
          {isNationwide ? (
            <div className="flex items-center justify-center h-16 border rounded-md bg-primary/5">
              <Badge variant="default" className="gap-2 text-base px-4 py-2">
                <MapPin className="h-4 w-4" />
                Nationwide Coverage (All 50 States)
              </Badge>
            </div>
          ) : (
            /* Individual State Badges */
            <div className="flex flex-wrap gap-2">
              {selectedRegions.map((region) => (
                <Badge
                  key={region.id}
                  variant="secondary"
                  className={cn('gap-2 pr-1 pl-3 py-1.5')}
                >
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  <span>
                    {region.name} ({region.state_code})
                  </span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRegion(region.id)}
                      className={cn(
                        'rounded-full p-0.5 hover:bg-background/20 transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                      )}
                      aria-label={`Remove ${region.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </>
      )}

      {/* Helper Text */}
      {selectedRegions.length === 0 && (
        <p className="text-xs text-muted-foreground">
          At least one service region is required for your profile.
        </p>
      )}

      {/* Selection Modal */}
      <RegionSelectionModal
        open={showModal}
        onOpenChange={setShowModal}
        selectedRegions={selectedRegions}
        onSave={handleSave}
      />
    </div>
  );
}
