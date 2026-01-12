'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AgencyCard from '@/components/AgencyCard';
import AgencyCardSkeleton from '@/components/AgencyCardSkeleton';
import ApiErrorState from '@/components/ApiErrorState';
import DirectoryFilters, { FilterState } from '@/components/DirectoryFilters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createSlug } from '@/lib/utils/formatting';
import { allStates, allTrades } from '@/lib/mock-data';
import {
  Building2,
  Users,
  ArrowRight,
  Filter,
  Search,
  MapPin,
  Award,
  Briefcase,
  Zap,
  Loader2,
} from 'lucide-react';
import { useAgencies } from '@/hooks/use-agencies';
import { useDebounce } from '@/hooks/use-debounce';
import { Agency, ComplianceType, COMPLIANCE_TYPES } from '@/types/api';
import Link from 'next/link';
import { ClaimStatusBanner } from '@/components/ClaimStatusBanner';
import { EmptyState } from '@/components/EmptyState';

// Helper to validate and filter compliance query parameters
function validateComplianceParams(params: string[]): ComplianceType[] {
  const validTypes = new Set(COMPLIANCE_TYPES);
  return params.filter((p): p is ComplianceType =>
    validTypes.has(p as ComplianceType)
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    trades: searchParams.getAll('trades[]') || [],
    states: searchParams.getAll('states[]') || [],
    compliance: validateComplianceParams(searchParams.getAll('compliance[]')),
    perDiem: null,
    union: null,
    claimedOnly: false,
    companySize: [],
    focusAreas: [],
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  // Debounce the search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(filters.search, 300);

  // Track if we're in a searching state (user has typed but debounce hasn't fired)
  const isSearching = filters.search !== debouncedSearchQuery;

  // Fetch agencies from API with debounced search and filters
  const {
    data: apiResponse,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useAgencies({
    search: debouncedSearchQuery,
    trades: filters.trades,
    states: filters.states,
    compliance: filters.compliance,
    limit,
    offset,
  });

  // Update URL when search or filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    // Handle search
    if (debouncedSearchQuery) {
      params.set('search', debouncedSearchQuery);
    } else {
      params.delete('search');
    }

    // Handle trades filter
    if (filters.trades.length > 0) {
      params.delete('trades[]'); // Clear existing
      filters.trades.forEach((trade) => {
        params.append('trades[]', trade);
      });
    } else {
      params.delete('trades[]');
    }

    // Handle states filter
    if (filters.states.length > 0) {
      params.delete('states[]'); // Clear existing
      filters.states.forEach((state) => {
        params.append('states[]', state);
      });
    } else {
      params.delete('states[]');
    }

    // Handle compliance filter
    if (filters.compliance.length > 0) {
      params.delete('compliance[]'); // Clear existing
      filters.compliance.forEach((compliance) => {
        params.append('compliance[]', compliance);
      });
    } else {
      params.delete('compliance[]');
    }

    // Use replace to avoid adding to browser history on every change
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [
    debouncedSearchQuery,
    filters.trades,
    filters.states,
    filters.compliance,
    router,
    searchParams,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
  }, [
    debouncedSearchQuery,
    filters.trades,
    filters.states,
    filters.compliance,
  ]);

  // Process API data and accumulate results for pagination
  const [allAgencies, setAllAgencies] = useState<Agency[]>([]);

  useEffect(() => {
    if (apiResponse?.data) {
      if (offset === 0) {
        // Reset agencies when starting fresh
        setAllAgencies(apiResponse.data);
      } else {
        // Append new agencies for pagination
        setAllAgencies((prev) => [...prev, ...apiResponse.data]);
      }
    }
  }, [apiResponse?.data, offset]);

  const agencies = useMemo(() => {
    return allAgencies.map((agency, index) => ({
      ...agency,
      // Convert null values to undefined for AgencyCard compatibility
      description: agency.description || undefined,
      logo_url: agency.logo_url || undefined,
      website: agency.website || undefined,
      phone: agency.phone || undefined,
      email: agency.email || undefined,
      founded_year: agency.founded_year || undefined,
      employee_count: agency.employee_count || undefined,
      headquarters: agency.headquarters || undefined,
      rating: agency.rating || undefined,
      // Map trades to string array for AgencyCard component
      trades: agency.trades?.map((t) => t.name) || [],
      // Pass full Region objects for AgencyCard component
      regions: agency.regions || [],
      // Add any additional fields needed for UI
      reviewCount: agency.review_count || 12 + ((index * 7) % 88),
      projectCount: agency.project_count || 45 + ((index * 13) % 455),
      verified: agency.verified ?? index % 3 === 0,
      featured: agency.featured ?? index < 3,
    }));
  }, [allAgencies]);

  // Filter agencies based on current filters (API handles search/trades/states)
  const filteredAgencies = useMemo(() => {
    let filtered = agencies.filter((agency) => {
      // Client-side filters for properties not handled by API
      if (filters.perDiem !== null) {
        if (agency.offers_per_diem !== filters.perDiem) return false;
      }

      if (filters.union !== null) {
        if (agency.is_union !== filters.union) return false;
      }

      if (filters.claimedOnly && !agency.is_claimed) return false;

      return true;
    });

    // Sort results
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'reviews':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'projects':
        filtered.sort((a, b) => b.projectCount - a.projectCount);
        break;
      case 'founded':
        filtered.sort((a, b) => {
          const aYear = a.founded_year || 9999;
          const bYear = b.founded_year || 9999;
          return aYear - bYear;
        });
        break;
      default:
        // Featured agencies first, then alphabetical
        filtered.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.name.localeCompare(b.name);
        });
    }

    return filtered;
  }, [agencies, filters, sortBy]);

  const activeFilterCount =
    filters.trades.length +
    filters.states.length +
    filters.compliance.length +
    (filters.perDiem !== null ? 1 : 0) +
    (filters.union !== null ? 1 : 0) +
    (filters.claimedOnly ? 1 : 0) +
    filters.companySize.length +
    filters.focusAreas.length;

  const hasActiveFilters = filters.search || activeFilterCount > 0;

  const clearAllFilters = () => {
    setFilters({
      search: '',
      trades: [],
      states: [],
      compliance: [],
      perDiem: null,
      union: null,
      claimedOnly: false,
      companySize: [],
      focusAreas: [],
    });
  };

  return (
    <div className="min-h-screen bg-industrial-bg-primary">
      <Header />

      {/* Claim Status Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <ClaimStatusBanner />
      </div>

      {/* Industrial Hero Section */}
      <section className="relative py-24 bg-industrial-bg-primary border-b-[3px] border-industrial-graphite-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust Indicator */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-industrial-graphite-100 border-2 border-industrial-graphite-200 rounded-industrial-sharp">
            <Zap className="h-4 w-4 text-industrial-orange" />
            <span className="font-body text-sm font-semibold uppercase tracking-wide text-industrial-graphite-500">
              Trusted by 10,000+ construction professionals
            </span>
          </div>

          {/* Hero Title */}
          <h1 className="font-display text-[clamp(3rem,8vw,6rem)] uppercase tracking-wide leading-[0.9] mb-6 text-industrial-graphite-600">
            Find Elite Construction
            <br />
            <span className="text-industrial-orange">Staffing Partners</span>
          </h1>

          <p className="font-body text-xl text-industrial-graphite-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Connect with premium staffing agencies specializing in construction
            trades and skilled labor across North America
          </p>

          {/* Industrial Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-industrial-bg-card border-2 border-industrial-graphite-200 rounded-industrial-base p-4 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-4 h-5 w-5 text-industrial-graphite-400" />
                  <Input
                    placeholder="Search companies, specialties, or locations..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    className="font-body pl-12 pr-12 h-14 text-base border-2 border-industrial-graphite-300 rounded-industrial-sharp focus:border-industrial-orange focus:ring-0"
                  />
                  {/* Loading indicator for search */}
                  {(isSearching || isValidating) && (
                    <div className="absolute right-4 top-4">
                      <Loader2 className="h-5 w-5 text-industrial-graphite-400 animate-spin" />
                      <span className="sr-only">Searching agencies</span>
                    </div>
                  )}
                </div>
                <Select
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setFilters((prev) => ({ ...prev, states: [] }));
                    } else {
                      setFilters((prev) => ({ ...prev, states: [value] }));
                    }
                  }}
                >
                  <SelectTrigger className="font-body w-full lg:w-56 h-14 border-2 border-industrial-graphite-300 rounded-industrial-sharp">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">All Locations</SelectItem>
                    {allStates.map((state) => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setFilters((prev) => ({ ...prev, trades: [] }));
                    } else {
                      // Derive slug from the selected display name
                      const tradeSlug = createSlug(value);
                      setFilters((prev) => ({ ...prev, trades: [tradeSlug] }));
                    }
                  }}
                >
                  <SelectTrigger className="font-body w-full lg:w-56 h-14 border-2 border-industrial-graphite-300 rounded-industrial-sharp">
                    <SelectValue placeholder="Specialty" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">All Specialties</SelectItem>
                    {[...allTrades].sort().map((trade) => (
                      <SelectItem key={trade} value={trade}>
                        {trade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="font-body text-sm font-semibold uppercase tracking-wide bg-industrial-orange text-white hover:bg-industrial-orange-500 h-14 px-8 rounded-industrial-sharp transition-all duration-200"
                  onClick={() => {
                    // Scroll to results section
                    const resultsSection =
                      document.getElementById('results-section');
                    if (resultsSection) {
                      resultsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 mb-16">
            <Button
              size="lg"
              className="font-body text-sm font-semibold uppercase tracking-wide bg-industrial-orange text-white hover:bg-industrial-orange-500 h-14 px-10 rounded-industrial-sharp transition-all duration-200"
              asChild
            >
              <Link href="/request-labor">
                Request Labor
                <ArrowRight className="ml-3 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-body text-sm font-semibold uppercase tracking-wide border-2 border-industrial-graphite-400 text-industrial-graphite-500 hover:border-industrial-graphite-600 hover:text-industrial-graphite-600 h-14 px-10 rounded-industrial-sharp transition-all duration-200"
              asChild
            >
              <Link href="/claim-listing">Claim Your Listing</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12 border-t-2 border-industrial-graphite-200">
            <div className="text-center">
              <div className="font-display text-4xl md:text-5xl text-industrial-graphite-600">
                {isLoading ? '...' : agencies.length + '+'}
              </div>
              <div className="font-body text-xs uppercase tracking-widest text-industrial-graphite-400 mt-2">
                Verified Agencies
              </div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl md:text-5xl text-industrial-graphite-600">
                45+
              </div>
              <div className="font-body text-xs uppercase tracking-widest text-industrial-graphite-400 mt-2">
                Trade Specialties
              </div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl md:text-5xl text-industrial-graphite-600">
                50
              </div>
              <div className="font-body text-xs uppercase tracking-widest text-industrial-graphite-400 mt-2">
                States Covered
              </div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl md:text-5xl text-industrial-orange">
                24h
              </div>
              <div className="font-body text-xs uppercase tracking-widest text-industrial-graphite-400 mt-2">
                Avg Response Time
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Directory Section */}
      <section
        id="results-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        {/* Results Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
          <div>
            <h2 className="font-display text-4xl uppercase tracking-wide text-industrial-graphite-600 mb-3">
              Premium Staffing Partners
            </h2>
            <p className="font-body text-industrial-graphite-500 text-base">
              {filteredAgencies.length} verified companies
              {activeFilterCount > 0 &&
                ` • ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied`}
              {filters.search && ' • Search active'}• Updated daily
            </p>
          </div>
          <div className="flex items-center gap-4 mt-6 lg:mt-0">
            <Button variant="outline" className="modern-button-secondary">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 modern-button-secondary">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Recommended</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="projects">Most Projects</SelectItem>
                <SelectItem value="founded">Most Established</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters */}
        <DirectoryFilters
          onFiltersChange={setFilters}
          totalResults={filteredAgencies.length}
          isLoading={isValidating || isSearching}
        />

        {/* Results Grid */}
        {isLoading && !apiResponse ? (
          <div className="space-y-6 mt-8">
            {/* Show 6-8 skeleton cards while initial loading */}
            {[...Array(6)].map((_, index) => (
              <AgencyCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="mt-8">
            <ApiErrorState
              error={error}
              onRetry={() => mutate()}
              title="Unable to load agencies"
              message="We encountered an error while loading the staffing agencies. Please try again or contact support if the problem persists."
            />
          </div>
        ) : filteredAgencies.length > 0 ? (
          <div className="space-y-6 mt-8">
            {filteredAgencies.map((agency, index) => (
              <div key={agency.id} className="relative">
                {agency.featured && (
                  <div className="absolute -top-3 left-6 z-10">
                    <Badge className="bg-orange-500 text-white px-3 py-1 font-medium">
                      <Award className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                )}
                <AgencyCard agency={agency} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            variant="no-results"
            title={debouncedSearchQuery ? 'No matches found' : 'No agencies found'}
            description={
              debouncedSearchQuery
                ? `We couldn't find any agencies matching "${debouncedSearchQuery}". Try a different search term or browse all agencies.`
                : "We couldn't find any agencies matching your filters. Try adjusting your criteria or browse all agencies."
            }
            illustration={debouncedSearchQuery ? 'search' : 'filter'}
            action={
              hasActiveFilters || debouncedSearchQuery
                ? {
                    label: 'Clear All Filters',
                    onClick: clearAllFilters,
                  }
                : undefined
            }
          />
        )}

        {/* Load More Button */}
        {filteredAgencies.length > 0 && apiResponse?.pagination?.hasMore && (
          <div className="text-center mt-16">
            <Button
              variant="outline"
              size="lg"
              className="px-8 modern-button-secondary"
              onClick={() => setOffset((prev) => prev + limit)}
              disabled={isLoading || isValidating}
            >
              {isLoading || isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Companies'
              )}
            </Button>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-16 modern-hero-bg text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Find Your Next Staffing Partner?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Submit one request and get responses from multiple qualified
            agencies
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 h-14 px-10 rounded-2xl shadow-lg shadow-orange-600/25"
              asChild
            >
              <Link href="/request-labor">
                Request Labor Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-slate-900 h-14 px-10 rounded-2xl"
              asChild
            >
              <Link href="/claim-listing">List Your Agency</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Loading fallback component
function HomePageLoading() {
  return (
    <div className="min-h-screen bg-industrial-bg-primary">
      <Header />
      <section className="relative py-24 bg-industrial-bg-primary border-b-[3px] border-industrial-graphite-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-industrial-graphite-200 rounded-industrial-sharp mx-auto mb-8"></div>
            <div className="h-16 w-96 bg-industrial-graphite-200 rounded-industrial-sharp mx-auto mb-4"></div>
            <div className="h-16 w-80 bg-industrial-graphite-200 rounded-industrial-sharp mx-auto mb-12"></div>
            <div className="h-14 w-full max-w-4xl bg-industrial-graphite-200 rounded-industrial-base mx-auto"></div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

// Main export with Suspense boundary
export default function HomePage() {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomePageContent />
    </Suspense>
  );
}
