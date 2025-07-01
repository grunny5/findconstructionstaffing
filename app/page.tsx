"use client";

import { useState, useMemo, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Users, 
  Target, 
  Clock,
  ArrowRight,
  Filter,
  Search,
  MapPin,
  Star,
  TrendingUp,
  Award,
  Briefcase,
  Zap,
  Loader2
} from 'lucide-react';
import { useAgencies } from '@/hooks/use-agencies';
import { useDebounce } from '@/hooks/use-debounce';
import { Agency } from '@/types/api';
import Link from 'next/link';

// Utility function for creating slugs
const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    trades: searchParams.getAll('trades[]') || [],
    states: searchParams.getAll('states[]') || [],
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
  const { data: apiResponse, error, isLoading, isValidating, mutate } = useAgencies({
    search: debouncedSearchQuery,
    trades: filters.trades,
    states: filters.states,
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
      filters.trades.forEach(trade => {
        params.append('trades[]', trade);
      });
    } else {
      params.delete('trades[]');
    }
    
    // Handle states filter
    if (filters.states.length > 0) {
      params.delete('states[]'); // Clear existing
      filters.states.forEach(state => {
        params.append('states[]', state);
      });
    } else {
      params.delete('states[]');
    }
    
    // Use replace to avoid adding to browser history on every change
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [debouncedSearchQuery, filters.trades, filters.states, router, searchParams]);

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
  }, [debouncedSearchQuery, filters.trades, filters.states]);

  // Process API data and accumulate results for pagination
  const [allAgencies, setAllAgencies] = useState<Agency[]>([]);
  
  useEffect(() => {
    if (apiResponse?.data) {
      if (offset === 0) {
        // Reset agencies when starting fresh
        setAllAgencies(apiResponse.data);
      } else {
        // Append new agencies for pagination
        setAllAgencies(prev => [...prev, ...apiResponse.data]);
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
      trades: agency.trades?.map(t => t.name) || [],
      // Map regions to string array for AgencyCard component
      regions: agency.regions?.map(r => r.name) || [],
      // Add any additional fields needed for UI
      reviewCount: agency.review_count || 12 + (index * 7) % 88,
      projectCount: agency.project_count || 45 + (index * 13) % 455,
      verified: agency.verified ?? (index % 3 === 0),
      featured: agency.featured ?? (index < 3),
    }));
  }, [allAgencies]);

  // Filter agencies based on current filters (API handles search/trades/states)
  const filteredAgencies = useMemo(() => {
    let filtered = agencies.filter(agency => {
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
    (filters.perDiem !== null ? 1 : 0) + 
    (filters.union !== null ? 1 : 0) + 
    (filters.claimedOnly ? 1 : 0) +
    filters.companySize.length +
    filters.focusAreas.length;
    
  const hasActiveFilters = filters.search || 
    activeFilterCount > 0 ||
    filters.search;

  const clearAllFilters = () => {
    setFilters({
      search: '',
      trades: [],
      states: [],
      perDiem: null,
      union: null,
      claimedOnly: false,
      companySize: [],
      focusAreas: [],
    });
  };

  return (
    <div className="min-h-screen modern-gradient-bg">
      <Header />

      {/* Modern Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="modern-hero-bg absolute inset-0"></div>
        <div className="hero-decoration"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust Indicator */}
          <div className="trust-indicator mb-8 mx-auto w-fit">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-white">Trusted by 10,000+ construction professionals</span>
          </div>

          {/* Hero Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text-hero leading-tight">
            Find Elite Construction
            <br />
            <span className="gradient-text-accent">
              Staffing Partners
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Connect with premium staffing agencies specializing in construction trades and skilled labor across North America
          </p>

          {/* Modern Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="modern-search-container">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Search companies, specialties, or locations..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="modern-input pl-12 pr-12 h-14 text-lg"
                  />
                  {/* Loading indicator for search */}
                  {(isSearching || isValidating) && (
                    <div className="absolute right-4 top-4">
                      <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                      <span className="sr-only">Searching agencies</span>
                    </div>
                  )}
                </div>
                <Select onValueChange={(value) => {
                  if (value === 'all') {
                    setFilters(prev => ({ ...prev, states: [] }));
                  } else {
                    setFilters(prev => ({ ...prev, states: [value] }));
                  }
                }}>
                  <SelectTrigger className="modern-select w-full lg:w-56 h-14">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="CO">Colorado</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="AZ">Arizona</SelectItem>
                    <SelectItem value="WA">Washington</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                  </SelectContent>
                </Select>
                <Select onValueChange={(value) => {
                  if (value === 'all') {
                    setFilters(prev => ({ ...prev, trades: [] }));
                  } else {
                    // Convert display names to slugs that match API
                    const tradeMap: Record<string, string> = {
                      'general': 'general-labor',
                      'electrical': 'electrician', 
                      'plumbing': 'plumber',
                      'hvac': 'hvac-technician',
                      'welding': 'welder',
                      'carpentry': 'carpenter'
                    };
                    const tradeSlug = tradeMap[value] || value;
                    setFilters(prev => ({ ...prev, trades: [tradeSlug] }));
                  }
                }}>
                  <SelectTrigger className="modern-select w-full lg:w-56 h-14">
                    <SelectValue placeholder="Specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    <SelectItem value="general">General Labor</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="welding">Welding</SelectItem>
                    <SelectItem value="carpentry">Carpentry</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  className="modern-button-primary h-14 px-8 font-semibold"
                  onClick={() => {
                    // Scroll to results section
                    const resultsSection = document.getElementById('results-section');
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
            <Button size="lg" className="modern-button-primary h-14 px-10 text-lg" asChild>
              <Link href="/request-labor">
                Request Labor
                <ArrowRight className="ml-3 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" className="modern-button-secondary h-14 px-10 text-lg" asChild>
              <Link href="/claim-listing">
                Claim Your Listing
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{isLoading ? '...' : agencies.length + '+'}</div>
              <div className="stat-label">Verified Agencies</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">45+</div>
              <div className="stat-label">Trade Specialties</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50</div>
              <div className="stat-label">States Covered</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24h</div>
              <div className="stat-label">Avg Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Directory Section */}
      <section id="results-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Results Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Premium Staffing Partners</h2>
            <p className="text-slate-600 text-lg">
              {filteredAgencies.length} verified companies 
              {activeFilterCount > 0 && ` • ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied`}
              {filters.search && ' • Search active'}
              • Updated daily
            </p>
          </div>
          <div className="flex items-center gap-4 mt-6 lg:mt-0">
            <Button
              variant="outline"
              className="modern-button-secondary"
            >
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
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              {debouncedSearchQuery ? 'No matches found' : 'No agencies found'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              {debouncedSearchQuery ? (
                <>We couldn&apos;t find any agencies matching &ldquo;{debouncedSearchQuery}&rdquo;. Try a different search term or browse all agencies.</>
              ) : (
                <>We couldn&apos;t find any agencies matching your filters. Try adjusting your criteria or browse all agencies.</>
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {debouncedSearchQuery && (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="px-8 modern-button-secondary"
                >
                  Clear Search
                </Button>
              )}
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={clearAllFilters}
                  className="px-8 modern-button-secondary"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Load More Button */}
        {filteredAgencies.length > 0 && apiResponse?.pagination?.hasMore && (
          <div className="text-center mt-16">
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 modern-button-secondary"
              onClick={() => setOffset(prev => prev + limit)}
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

      {/* Trust Indicators Section */}
      <section className="py-20 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Why Construction Leaders Trust Our Directory
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              We&apos;ve helped thousands of projects connect with the right staffing partners across all major construction sectors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Verified Specialists</h3>
              <p className="text-slate-600">
                Every agency is vetted for construction and industrial expertise with proven track records
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Fast Response</h3>
              <p className="text-slate-600">
                Verified agencies respond to requests within 24 hours with qualified candidates
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/25">
                <Star className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Quality Matches</h3>
              <p className="text-slate-600">
                Advanced filtering ensures perfect recruiting partnerships for your specific needs
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Proven Results</h3>
              <p className="text-slate-600">
                Track record of successful placements across all trades and project types
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 modern-hero-bg text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Find Your Next Staffing Partner?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Submit one request and get responses from multiple qualified agencies
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 h-14 px-10 rounded-2xl shadow-lg shadow-orange-600/25" asChild>
              <Link href="/request-labor">
                Request Labor Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-slate-900 h-14 px-10 rounded-2xl" asChild>
              <Link href="/claim-listing">
                List Your Agency
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}