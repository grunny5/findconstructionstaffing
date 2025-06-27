"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Target
} from 'lucide-react';
import { allTrades, allStates, companySizes, focusAreas } from '@/lib/mock-data';

interface DirectoryFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  totalResults: number;
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

export default function DirectoryFilters({ onFiltersChange, totalResults }: DirectoryFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    trades: [],
    states: [],
    perDiem: null,
    union: null,
    claimedOnly: false,
    companySize: [],
    focusAreas: [],
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

  const hasActiveFilters = filters.search || 
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
        updateFilters({ trades: filters.trades.filter(t => t !== value) });
        break;
      case 'state':
        updateFilters({ states: filters.states.filter(s => s !== value) });
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
        updateFilters({ companySize: filters.companySize.filter(s => s !== value) });
        break;
      case 'focusArea':
        updateFilters({ focusAreas: filters.focusAreas.filter(f => f !== value) });
        break;
    }
  };

  const FilterPopover = ({ 
    trigger, 
    title, 
    icon: Icon, 
    children, 
    activeCount = 0 
  }: { 
    trigger: string; 
    title: string; 
    icon: any; 
    children: React.ReactNode; 
    activeCount?: number;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 border-gray-300 hover:border-gray-400">
          <Icon className="h-4 w-4 mr-2" />
          {trigger}
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {activeCount}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b">
          <h4 className="font-semibold text-sm flex items-center">
            <Icon className="h-4 w-4 mr-2" />
            {title}
          </h4>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
  return (
    <div className="space-y-6">
      {/* Main Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search agencies by name..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-10"
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
              {allTrades.map((trade) => (
                <div key={trade} className="flex items-center space-x-3">
                  <Checkbox
                    id={`trade-${trade}`}
                    checked={filters.trades.includes(trade)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFilters({ trades: [...filters.trades, trade] });
                      } else {
                        updateFilters({ trades: filters.trades.filter(t => t !== trade) });
                      }
                    }}
                  />
                  <Label 
                    htmlFor={`trade-${trade}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {trade}
                  </Label>
                </div>
              ))}
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
                    checked={filters.states.includes(state.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFilters({ states: [...filters.states, state.name] });
                      } else {
                        updateFilters({ states: filters.states.filter(s => s !== state.name) });
                      }
                    }}
                  />
                  <Label 
                    htmlFor={`state-${state.code}`}
                    className="text-sm font-normal cursor-pointer flex-1"
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
                        updateFilters({ companySize: [...filters.companySize, size] });
                      } else {
                        updateFilters({ companySize: filters.companySize.filter(s => s !== size) });
                      }
                    }}
                  />
                  <Label 
                    htmlFor={`size-${size}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {size}
                  </Label>
                </div>
              ))}
            </div>
          </FilterPopover>

          {/* Per Diem Filter */}
          <Select
            value={filters.perDiem === null ? 'any' : filters.perDiem.toString()}
            onValueChange={(value) => {
              updateFilters({ 
                perDiem: value === 'any' ? null : value === 'true' 
              });
            }}
          >
            <SelectTrigger className="w-48 h-10">
              <DollarSign className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Per Diem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Per Diem</SelectItem>
              <SelectItem value="true">Offers Per Diem</SelectItem>
              <SelectItem value="false">No Per Diem</SelectItem>
            </SelectContent>
          </Select>

          {/* Union Status Filter */}
          <Select
            value={filters.union === null ? 'any' : filters.union.toString()}
            onValueChange={(value) => {
              updateFilters({ 
                union: value === 'any' ? null : value === 'true' 
              });
            }}
          >
            <SelectTrigger className="w-48 h-10">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Union Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Union Status</SelectItem>
              <SelectItem value="true">Union Partner</SelectItem>
              <SelectItem value="false">Non-Union</SelectItem>
            </SelectContent>
          </Select>

          {/* Verification Status */}
          <div className="flex items-center space-x-3 px-3 py-2 border border-gray-300 rounded-md">
            <Checkbox
              id="claimed-only"
              checked={filters.claimedOnly}
              onCheckedChange={(checked) => updateFilters({ claimedOnly: checked as boolean })}
            />
            <Label htmlFor="claimed-only" className="text-sm font-normal cursor-pointer flex items-center">
              <Award className="h-4 w-4 mr-2 text-green-600" />
              Verified Only
            </Label>
          </div>
        </div>

        {/* Results Count and Clear Filters */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{totalResults}</span> {totalResults === 1 ? 'agency' : 'agencies'} found
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-blue-600 hover:text-blue-700">
              Clear All Filters
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Active Filters</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                Search: &quot;{filters.search}&quot;
                <button 
                  onClick={() => removeFilter('search')}
                  className="ml-2 hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.trades.slice(0, 3).map(trade => (
              <Badge key={trade} variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                {trade}
                <button 
                  onClick={() => removeFilter('trade', trade)}
                  className="ml-2 hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.trades.length > 3 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                +{filters.trades.length - 3} more trades
              </Badge>
            )}
            {filters.states.slice(0, 2).map(state => (
              <Badge key={state} variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                {state}
                <button 
                  onClick={() => removeFilter('state', state)}
                  className="ml-2 hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.states.length > 2 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                +{filters.states.length - 2} more states
              </Badge>
            )}
            {filters.perDiem !== null && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                {filters.perDiem ? 'Offers Per Diem' : 'No Per Diem'}
                <button 
                  onClick={() => removeFilter('perDiem')}
                  className="ml-2 hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.union !== null && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                {filters.union ? 'Union Partner' : 'Non-Union'}
                <button 
                  onClick={() => removeFilter('union')}
                  className="ml-2 hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.claimedOnly && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                Verified Only
                <button 
                  onClick={() => removeFilter('claimed')}
                  className="ml-2 hover:text-blue-900"
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