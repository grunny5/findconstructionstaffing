'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import type { Region } from '@/types/supabase';
import { cn } from '@/lib/utils';

interface RegionSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRegions: Region[];
  onSave: (regions: Region[]) => void;
}

// Regional groupings for quick-select buttons
const REGIONAL_GROUPS = {
  'West Coast': ['CA', 'OR', 'WA'],
  'East Coast': [
    'ME',
    'NH',
    'VT',
    'MA',
    'RI',
    'CT',
    'NY',
    'NJ',
    'PA',
    'DE',
    'MD',
    'VA',
    'NC',
    'SC',
    'GA',
    'FL',
  ],
  Midwest: [
    'OH',
    'MI',
    'IN',
    'WI',
    'IL',
    'MN',
    'IA',
    'MO',
    'ND',
    'SD',
    'NE',
    'KS',
  ],
  South: ['WV', 'KY', 'TN', 'AR', 'LA', 'MS', 'AL'],
  Southwest: ['OK', 'TX', 'NM', 'AZ'],
  Mountain: ['MT', 'ID', 'WY', 'NV', 'UT', 'CO'],
  Pacific: ['AK', 'HI'],
};

/**
 * Region selection modal for agency service area management
 *
 * Features:
 * - Searchable/alphabetical list of all 50 US states
 * - Quick-select buttons for regional groupings
 * - "All USA" to select all states
 * - "Clear All" to deselect everything
 * - Selected state count display
 * - Validation: at least 1 state required
 *
 * @param open - Whether the modal is open
 * @param onOpenChange - Callback when modal open state changes
 * @param selectedRegions - Currently selected regions
 * @param onSave - Callback when save button is clicked
 */
export function RegionSelectionModal({
  open,
  onOpenChange,
  selectedRegions,
  onSave,
}: RegionSelectionModalProps) {
  const [allRegions, setAllRegions] = useState<Region[]>([]);
  const [workingSelection, setWorkingSelection] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all regions from database
  useEffect(() => {
    if (!open) return;

    async function fetchRegions() {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('regions')
          .select('id, name, state_code, slug')
          .order('name', { ascending: true });

        if (fetchError) throw fetchError;

        setAllRegions(data || []);
        setWorkingSelection(selectedRegions);
      } catch (err) {
        console.error('Error fetching regions:', err);
        setError('Failed to load regions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRegions();
  }, [open, selectedRegions]);

  const handleToggleRegion = (region: Region) => {
    setError(null); // Clear error when user makes a selection
    setWorkingSelection((prev) => {
      const exists = prev.some((r) => r.id === region.id);
      if (exists) {
        return prev.filter((r) => r.id !== region.id);
      } else {
        return [...prev, region];
      }
    });
  };

  const handleQuickSelect = (stateCodes: string[]) => {
    setError(null); // Clear error when user makes a selection
    const regionsToAdd = allRegions.filter((r) =>
      stateCodes.includes(r.state_code)
    );

    setWorkingSelection((prev) => {
      // Remove duplicates by creating a Set of IDs
      const existingIds = new Set(prev.map((r) => r.id));
      const newRegions = regionsToAdd.filter((r) => !existingIds.has(r.id));
      return [...prev, ...newRegions];
    });
  };

  const handleSelectAllUSA = () => {
    setError(null); // Clear error when user makes a selection
    setWorkingSelection([...allRegions]);
  };

  const handleClearAll = () => {
    setError(null); // Clear error when user makes a selection
    setWorkingSelection([]);
  };

  const handleSave = () => {
    // Validation: at least 1 state required
    if (workingSelection.length === 0) {
      setError('Please select at least one service region.');
      return;
    }

    onSave(workingSelection);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setWorkingSelection(selectedRegions);
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Closing the modal - reset state
      handleCancel();
    }
    onOpenChange(newOpen);
  };

  const isRegionSelected = (regionId: string) => {
    return workingSelection.some((r) => r.id === regionId);
  };

  const selectedCount = workingSelection.length;
  const totalCount = allRegions.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Service Regions
          </DialogTitle>
          <DialogDescription>
            Choose the US states where your agency provides staffing services.
            Select at least one region.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error State - shown above content if regions loaded, or alone if fetch failed */}
          {error && !isLoading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Content - shown if not loading AND (no error OR regions are loaded) */}
          {!isLoading && (!error || allRegions.length > 0) && (
            <>
              {/* Selection Summary */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-normal">
                    {selectedCount} of {totalCount} states selected
                  </Badge>
                  {selectedCount === totalCount && (
                    <Badge variant="default">Nationwide</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllUSA}
                    disabled={selectedCount === totalCount}
                  >
                    All USA
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={selectedCount === 0}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Quick Select Regional Buttons */}
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Quick Select by Region
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(REGIONAL_GROUPS).map(
                    ([regionName, stateCodes]) => (
                      <Button
                        key={regionName}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleQuickSelect(stateCodes)}
                        className="gap-2"
                      >
                        <MapPin className="h-3 w-3" />
                        {regionName}
                      </Button>
                    )
                  )}
                </div>
              </div>

              {/* State Checkboxes */}
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Select Individual States
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {allRegions.map((region) => {
                    const isSelected = isRegionSelected(region.id);

                    return (
                      <label
                        key={region.id}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors',
                          'hover:bg-accent hover:border-accent-foreground/20',
                          isSelected &&
                            'bg-primary/5 border-primary/30 hover:bg-primary/10'
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleRegion(region)}
                          aria-label={`Select ${region.name}`}
                        />
                        <span className="text-sm flex-1">
                          {region.name}
                          <span className="text-muted-foreground ml-1">
                            ({region.state_code})
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || selectedCount === 0}
          >
            Save Regions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
