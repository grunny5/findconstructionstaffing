"use client";

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AgencyCard from '@/components/AgencyCard';
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
  Zap
} from 'lucide-react';
import { mockAgencies } from '@/lib/mock-data';
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');

  // Convert mock data to proper format with enhanced data
  const agencies = useMemo(() => {
    return mockAgencies.map((agency, index) => ({
      id: createSlug(agency.name),
      name: agency.name,
      slug: createSlug(agency.name),
      description: agency.description,
      logo_url: agency.logo_url,
      website: agency.website,
      phone: '',
      email: '',
      is_claimed: index % 3 === 0, // Every 3rd agency is claimed for demo
      is_active: true,
      offers_per_diem: agency.offers_per_diem,
      is_union: agency.is_union,
      trades: agency.trades,
      regions: agency.regions,
      rating: 4.1 + (index % 9) / 10, // Ratings between 4.1-4.9
      reviewCount: 12 + (index * 7) % 88, // Review counts between 12-100
      projectCount: 45 + (index * 13) % 455, // Project counts between 45-500
      founded_year: agency.founded_year,
      employee_count: agency.employee_count,
      headquarters: agency.headquarters,
      verified: index % 3 === 0,
      featured: index < 3, // First 3 agencies are featured
    }));
  }, []);

  // Filter agencies based on current filters and search
  const filteredAgencies = useMemo(() => {
    let filtered = agencies.filter(agency => {
      // Global search filter
      if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
        const matchesName = agency.name.toLowerCase().includes(searchTerm);
        const matchesDescription = agency.description?.toLowerCase().includes(searchTerm);
        const matchesTrades = agency.trades?.some(trade => 
          trade.toLowerCase().includes(searchTerm)
        );
        const matchesLocation = agency.regions?.some(region =>
          region.toLowerCase().includes(searchTerm)
        );
        if (!matchesName && !matchesDescription && !matchesTrades && !matchesLocation) return false;
      }

      // Other filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesName = agency.name.toLowerCase().includes(searchTerm);
        const matchesDescription = agency.description?.toLowerCase().includes(searchTerm);
        if (!matchesName && !matchesDescription) return false;
      }

      if (filters.trades.length > 0) {
        const hasMatchingTrade = agency.trades?.some(trade => 
          filters.trades.includes(trade)
        );
        if (!hasMatchingTrade) return false;
      }

      if (filters.states.length > 0) {
        const hasMatchingState = agency.regions?.some(region => 
          filters.states.includes(region)
        );
        if (!hasMatchingState) return false;
      }

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
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'projects':
        filtered.sort((a, b) => b.projectCount - a.projectCount);
        break;
      case 'founded':
        filtered.sort((a, b) => a.founded_year - b.founded_year);
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
  }, [agencies, filters, searchQuery, sortBy]);

  const hasActiveFilters = filters.search || 
    filters.trades.length > 0 || 
    filters.states.length > 0 || 
    filters.perDiem !== null || 
    filters.union !== null || 
    filters.claimedOnly ||
    searchQuery;

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
    setSearchQuery('');
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="modern-input pl-12 h-14 text-lg"
                  />
                </div>
                <Select>
                  <SelectTrigger className="modern-select w-full lg:w-56 h-14">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="co">Colorado</SelectItem>
                    <SelectItem value="tx">Texas</SelectItem>
                    <SelectItem value="az">Arizona</SelectItem>
                    <SelectItem value="wa">Washington</SelectItem>
                    <SelectItem value="ga">Georgia</SelectItem>
                    <SelectItem value="il">Illinois</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
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
                <Button className="modern-button-primary h-14 px-8 font-semibold">
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
              <div className="stat-number">{agencies.length}+</div>
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Results Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Premium Staffing Partners</h2>
            <p className="text-slate-600 text-lg">{filteredAgencies.length} verified companies • Updated daily</p>
          </div>
          <div className="flex items-center gap-4 mt-6 lg:mt-0">
            <Button
              variant="outline"
              className="modern-button-secondary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
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
        />

        {/* Results Grid */}
        {filteredAgencies.length > 0 ? (
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
            <Building2 className="h-20 w-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              No agencies found
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              We couldn&apos;t find any agencies matching your criteria. Try adjusting your filters or search terms.
            </p>
            <Button 
              variant="outline" 
              size="lg"
              onClick={clearAllFilters}
              className="px-8 modern-button-secondary"
            >
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Load More Button */}
        {filteredAgencies.length > 0 && filteredAgencies.length >= 10 && (
          <div className="text-center mt-16">
            <Button variant="outline" size="lg" className="px-8 modern-button-secondary">
              Load More Companies
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