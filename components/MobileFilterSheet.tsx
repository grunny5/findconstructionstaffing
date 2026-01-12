'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, X } from 'lucide-react';
import DirectoryFilters, { FilterState } from './DirectoryFilters';

interface MobileFilterSheetProps {
  onFiltersChange: (filters: FilterState) => void;
  totalResults: number;
  isLoading?: boolean;
  initialFilters?: Partial<FilterState>;
}

export function MobileFilterSheet({
  onFiltersChange,
  totalResults,
  isLoading,
  initialFilters,
}: MobileFilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="md:hidden min-h-[44px] min-w-[44px] w-full font-body text-sm font-semibold uppercase tracking-wide border-2 border-industrial-graphite-300 text-industrial-graphite-600 hover:border-industrial-orange hover:text-industrial-orange rounded-industrial-sharp"
        >
          <Filter className="h-5 w-5 mr-2" />
          Filter Agencies
          <span className="sr-only">Open filters</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[85vh] p-0 border-t-2 border-industrial-graphite-200 rounded-t-industrial-base overflow-hidden"
      >
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b-2 border-industrial-graphite-200 bg-industrial-graphite-100">
            <SheetTitle className="font-display text-xl uppercase text-industrial-graphite-600 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-industrial-orange" />
              Filter Agencies
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 bg-industrial-bg-card">
            <DirectoryFilters
              onFiltersChange={onFiltersChange}
              totalResults={totalResults}
              isLoading={isLoading}
              initialFilters={initialFilters}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
