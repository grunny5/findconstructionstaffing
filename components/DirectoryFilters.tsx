'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  MapPin,
  Wrench,
  DollarSign,
  Users,
  Award,
  Building2,
  Target,
} from 'lucide-react';
import {
  allTrades,
  allStates,
  companySizes,
  focusAreas,
} from '@/lib/mock-data';

// Helper function to convert trade names to slugs
const tradeToSlug = (trade: string): string => {
  return trade
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

interface DirectoryFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  totalResults: number;
  isLoading?: boolean;
  initialFilters?: Partial<FilterState>;
}

export interface FilterState {
  search: string;
  trades: string[];
  states: string[];
  perDiem: boolean | null;
  union: boolean | null;
  claimedOnly: boolean;
  companySize: string[];
  focusAreas: string[];
}

export default function DirectoryFilters({
  onFiltersChange,
  totalResults,
  isLoading,
  initialFilters,
}: DirectoryFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    trades: [],
    states: [],
    perDiem: null,
    union: null,
    claimedOnly: false,
    companySize: [],
    focusAreas: [],
    ...initialFilters,
  });

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const clearAllFilters = () => {
    const cleared: FilterState = {
      search: '',
      trades: [],
      states: [],
      perDiem: null,
      union: null,
      claimedOnly: false,
      companySize: [],
      focusAreas: [],
    };
    setFilters(cleared);
    onFiltersChange(cleared);
  };

  const hasActiveFilters =
    filters.search ||
    filters.trades.length > 0 ||
    filters.states.length > 0 ||
    filters.perDiem !== null ||
    filters.union !== null ||
    filters.claimedOnly ||
    filters.companySize.length > 0 ||
    filters.focusAreas.length > 0;

  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case 'search':
        updateFilters({ search: '' });
        break;
      case 'trade':
        updateFilters({ trades: filters.trades.filter((t) => t !== value) });
        break;
      case 'state':
        updateFilters({ states: filters.states.filter((s) => s !== value) });
        break;
      case 'perDiem':
        updateFilters({ perDiem: null });
        break;
      case 'union':
        updateFilters({ union: null });
        break;
      case 'claimed':
        updateFilters({ claimedOnly: false });
        break;
      case 'companySize':
        updateFilters({
          companySize: filters.companySize.filter((s) => s !== value),
        });
        break;
      case 'focusArea':
        updateFilters({
          focusAreas: filters.focusAreas.filter((f) => f !== value),
        });
        break;
    }
  };

  const FilterPopover = ({
    trigger,
    title,
    icon: Icon,
    children,
    activeCount = 0,
  }: {
    trigger: string;
    title: string;
    icon: any;
    children: React.ReactNode;
    activeCount?: number;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-10 font-body text-xs font-semibold uppercase tracking-wide border-2 border-industrial-graphite-300 text-industrial-graphite-500 hover:border-industrial-graphite-600 hover:text-industrial-graphite-600 rounded-industrial-sharp transition-all duration-200"
          disabled={isLoading}
        >
          <Icon className="h-4 w-4 mr-2" />
          {trigger}
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 text-xs bg-industrial-orange text-white rounded-industrial-sharp"
            >
              {activeCount}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 border-2 border-industrial-graphite-200 rounded-industrial-base"
        align="start"
      >
        <div className="p-4 border-b-2 border-industrial-graphite-200 bg-industrial-graphite-100">
          <h4 className="font-body text-xs font-semibold uppercase tracking-wide text-industrial-graphite-600 flex items-center">
            <Icon className="h-4 w-4 mr-2 text-industrial-graphite-400" />
            {title}
          </h4>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto bg-industrial-bg-card">
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
  return (
    <div className="space-y-6">
      {/* Main Filter Bar */}
      <div className="bg-industrial-bg-card border-2 border-industrial-graphite-200 rounded-industrial-base p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-industrial-graphite-400" />
            <Input
              placeholder="Search agencies by name..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-10 font-body text-base border-2 border-industrial-graphite-300 rounded-industrial-sharp focus:border-industrial-orange focus:ring-0"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Trade Specialties Filter */}
          <FilterPopover
            trigger="Trade Specialties"
            title="Trade Specialties"
            icon={Wrench}
            activeCount={filters.trades.length}
          >
            <div className="space-y-3">
              {allTrades.map((trade) => {
                const tradeSlug = tradeToSlug(trade);
                return (
                  <div key={trade} className="flex items-center space-x-3">
                    <Checkbox
                      id={`trade-${tradeSlug}`}
                      checked={filters.trades.includes(tradeSlug)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilters({
                            trades: [...filters.trades, tradeSlug],
                          });
                        } else {
                          updateFilters({
                            trades: filters.trades.filter(
                              (t) => t !== tradeSlug
                            ),
                          });
                        }
                      }}
                      className="border-2 border-industrial-graphite-300 data-[state=checked]:bg-industrial-orange data-[state=checked]:border-industrial-orange rounded-industrial-sharp"
                    />
                    <Label
                      htmlFor={`trade-${tradeSlug}`}
                      className="font-body text-sm text-industrial-graphite-500 cursor-pointer flex-1"
                    >
                      {trade}
                    </Label>
                  </div>
                );
              })}
            </div>
          </FilterPopover>

          {/* Service Areas Filter */}
          <FilterPopover
            trigger="Service Areas"
            title="Service Areas"
            icon={MapPin}
            activeCount={filters.states.length}
          >
            <div className="space-y-3">
              {allStates.map((state) => (
                <div key={state.code} className="flex items-center space-x-3">
                  <Checkbox
                    id={`state-${state.code}`}
                    checked={filters.states.includes(state.code)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFilters({
                          states: [...filters.states, state.code],
                        });
                      } else {
                        updateFilters({
                          states: filters.states.filter(
                            (s) => s !== state.code
                          ),
                        });
                      }
                    }}
                    className="border-2 border-industrial-graphite-300 data-[state=checked]:bg-industrial-orange data-[state=checked]:border-industrial-orange rounded-industrial-sharp"
                  />
                  <Label
                    htmlFor={`state-${state.code}`}
                    className="font-body text-sm text-industrial-graphite-500 cursor-pointer flex-1"
                  >
                    {state.name}
                  </Label>
                </div>
              ))}
            </div>
          </FilterPopover>

          {/* Company Size Filter */}
          <FilterPopover
            trigger="Company Size"
            title="Company Size"
            icon={Building2}
            activeCount={filters.companySize.length}
          >
            <div className="space-y-3">
              {companySizes.map((size) => (
                <div key={size} className="flex items-center space-x-3">
                  <Checkbox
                    id={`size-${size}`}
                    checked={filters.companySize.includes(size)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFilters({
                          companySize: [...filters.companySize, size],
                        });
                      } else {
                        updateFilters({
                          companySize: filters.companySize.filter(
                            (s) => s !== size
                          ),
                        });
                      }
                    }}
                    className="border-2 border-industrial-graphite-300 data-[state=checked]:bg-industrial-orange data-[state=checked]:border-industrial-orange rounded-industrial-sharp"
                  />
                  <Label
                    htmlFor={`size-${size}`}
                    className="font-body text-sm text-industrial-graphite-500 cursor-pointer flex-1"
                  >
                    {size}
                  </Label>
                </div>
              ))}
            </div>
          </FilterPopover>

          {/* Per Diem Filter */}
          <Select
            value={
              filters.perDiem === null ? 'any' : filters.perDiem.toString()
            }
            onValueChange={(value) => {
              updateFilters({
                perDiem: value === 'any' ? null : value === 'true',
              });
            }}
          >
            <SelectTrigger className="w-48 h-10 font-body text-xs font-semibold uppercase tracking-wide border-2 border-industrial-graphite-300 text-industrial-graphite-500 rounded-industrial-sharp focus:border-industrial-orange focus:ring-0">
              <DollarSign className="h-4 w-4 mr-2 text-industrial-graphite-400" />
              <SelectValue placeholder="Per Diem" />
            </SelectTrigger>
            <SelectContent className="border-2 border-industrial-graphite-200 rounded-industrial-base">
              <SelectItem
                value="any"
                className="font-body text-sm text-industrial-graphite-500"
              >
                Any Per Diem
              </SelectItem>
              <SelectItem
                value="true"
                className="font-body text-sm text-industrial-graphite-500"
              >
                Offers Per Diem
              </SelectItem>
              <SelectItem
                value="false"
                className="font-body text-sm text-industrial-graphite-500"
              >
                No Per Diem
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Union Status Filter */}
          <Select
            value={filters.union === null ? 'any' : filters.union.toString()}
            onValueChange={(value) => {
              updateFilters({
                union: value === 'any' ? null : value === 'true',
              });
            }}
          >
            <SelectTrigger className="w-48 h-10 font-body text-xs font-semibold uppercase tracking-wide border-2 border-industrial-graphite-300 text-industrial-graphite-500 rounded-industrial-sharp focus:border-industrial-orange focus:ring-0">
              <Users className="h-4 w-4 mr-2 text-industrial-graphite-400" />
              <SelectValue placeholder="Union Status" />
            </SelectTrigger>
            <SelectContent className="border-2 border-industrial-graphite-200 rounded-industrial-base">
              <SelectItem
                value="any"
                className="font-body text-sm text-industrial-graphite-500"
              >
                Any Union Status
              </SelectItem>
              <SelectItem
                value="true"
                className="font-body text-sm text-industrial-graphite-500"
              >
                Union Partner
              </SelectItem>
              <SelectItem
                value="false"
                className="font-body text-sm text-industrial-graphite-500"
              >
                Non-Union
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Verification Status */}
          <div className="flex items-center space-x-3 px-3 py-2 border-2 border-industrial-graphite-300 rounded-industrial-sharp">
            <Checkbox
              id="claimed-only"
              checked={filters.claimedOnly}
              onCheckedChange={(checked) =>
                updateFilters({ claimedOnly: checked as boolean })
              }
              className="border-2 border-industrial-graphite-300 data-[state=checked]:bg-industrial-orange data-[state=checked]:border-industrial-orange rounded-industrial-sharp"
            />
            <Label
              htmlFor="claimed-only"
              className="font-body text-xs font-semibold uppercase tracking-wide text-industrial-graphite-500 cursor-pointer flex items-center"
            >
              <Award className="h-4 w-4 mr-2 text-industrial-orange" />
              Verified Only
            </Label>
          </div>
        </div>

        {/* Results Count and Clear Filters */}
        <div className="flex items-center justify-between">
          <div className="font-body text-sm text-industrial-graphite-400 flex items-center gap-2">
            <span className={isLoading ? 'opacity-60' : ''}>
              <span className="font-semibold text-industrial-graphite-600">
                {totalResults}
              </span>{' '}
              {totalResults === 1 ? 'agency' : 'agencies'} found
            </span>
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-industrial-graphite-400">
                  <div className="animate-pulse h-1 w-1 bg-industrial-graphite-400 rounded-full"></div>
                  <div className="animate-pulse h-1 w-1 bg-industrial-graphite-400 rounded-full [animation-delay:150ms]"></div>
                  <div className="animate-pulse h-1 w-1 bg-industrial-graphite-400 rounded-full [animation-delay:300ms]"></div>
                </div>
                <span className="font-body text-xs text-industrial-graphite-400">
                  Updating...
                </span>
              </div>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="font-body text-xs font-semibold uppercase tracking-wide text-industrial-orange hover:text-industrial-orange-500 hover:bg-industrial-orange-100"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="bg-industrial-graphite-100 border-2 border-industrial-graphite-200 rounded-industrial-base p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-industrial-graphite-600">
              Active Filters
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge
                variant="secondary"
                className="bg-industrial-graphite-600 text-white font-body text-xs uppercase tracking-wide px-3 py-1 rounded-industrial-sharp"
              >
                Search: &quot;{filters.search}&quot;
                <button
                  onClick={() => removeFilter('search')}
                  className="ml-2 hover:text-industrial-graphite-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.trades.slice(0, 3).map((tradeSlug) => {
              // Find the original trade name from the slug
              const tradeName =
                allTrades.find((t) => tradeToSlug(t) === tradeSlug) ||
                tradeSlug;
              return (
                <Badge
                  key={tradeSlug}
                  variant="secondary"
                  className="bg-industrial-graphite-600 text-white font-body text-xs uppercase tracking-wide px-3 py-1 rounded-industrial-sharp"
                >
                  {tradeName}
                  <button
                    onClick={() => removeFilter('trade', tradeSlug)}
                    className="ml-2 hover:text-industrial-graphite-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
            {filters.trades.length > 3 && (
              <Badge
                variant="secondary"
                className="bg-industrial-graphite-400 text-white font-body text-xs uppercase tracking-wide px-3 py-1 rounded-industrial-sharp"
              >
                +{filters.trades.length - 3} more trades
              </Badge>
            )}
            {filters.states.slice(0, 2).map((stateCode) => {
              // Find the state name from the code
              const stateName =
                allStates.find((s) => s.code === stateCode)?.name || stateCode;
              return (
                <Badge
                  key={stateCode}
                  variant="secondary"
                  className="bg-industrial-graphite-600 text-white font-body text-xs uppercase tracking-wide px-3 py-1 rounded-industrial-sharp"
                >
                  {stateName}
                  <button
                    onClick={() => removeFilter('state', stateCode)}
                    className="ml-2 hover:text-industrial-graphite-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
            {filters.states.length > 2 && (
              <Badge
                variant="secondary"
                className="bg-industrial-graphite-400 text-white font-body text-xs uppercase tracking-wide px-3 py-1 rounded-industrial-sharp"
              >
                +{filters.states.length - 2} more states
              </Badge>
            )}
            {filters.perDiem !== null && (
              <Badge
                variant="secondary"
                className="bg-industrial-graphite-600 text-white font-body text-xs uppercase tracking-wide px-3 py-1 rounded-industrial-sharp"
              >
                {filters.perDiem ? 'Offers Per Diem' : 'No Per Diem'}
                <button
                  onClick={() => removeFilter('perDiem')}
                  className="ml-2 hover:text-industrial-graphite-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.union !== null && (
              <Badge
                variant="secondary"
                className="bg-industrial-graphite-600 text-white font-body text-xs uppercase tracking-wide px-3 py-1 rounded-industrial-sharp"
              >
                {filters.union ? 'Union Partner' : 'Non-Union'}
                <button
                  onClick={() => removeFilter('union')}
                  className="ml-2 hover:text-industrial-graphite-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.claimedOnly && (
              <Badge
                variant="secondary"
                className="bg-industrial-graphite-600 text-white font-body text-xs uppercase tracking-wide px-3 py-1 rounded-industrial-sharp"
              >
                Verified Only
                <button
                  onClick={() => removeFilter('claimed')}
                  className="ml-2 hover:text-industrial-graphite-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
