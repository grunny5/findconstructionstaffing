'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import type { AdminAgency } from '@/types/admin';

const AGENCIES_PER_PAGE = 20;

/**
 * Determines the text color class based on profile completion percentage
 * @param percentage - Profile completion percentage (0-100)
 * @returns Tailwind CSS text color class
 */
function getProfileCompletionColor(percentage: number): string {
  if (percentage >= 80) return 'text-industrial-orange';
  if (percentage >= 50) return 'text-industrial-graphite-500';
  return 'text-industrial-graphite-400';
}

interface AdminAgenciesTableProps {
  agencies: AdminAgency[];
}

export function AdminAgenciesTable({ agencies }: AdminAgenciesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || ''
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || 'all'
  );
  const [claimedFilter, setClaimedFilter] = useState(
    searchParams.get('claimed') || 'all'
  );
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get('page');
    const parsed = pageParam ? parseInt(pageParam, 10) : 1;
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  });

  // Debounce search term
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Update URL when filters change
  const updateURL = useCallback(
    (search: string, status: string, claimed: string, page: number) => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status !== 'all') params.set('status', status);
      if (claimed !== 'all') params.set('claimed', claimed);
      if (page > 1) params.set('page', page.toString());

      const queryString = params.toString();
      router.push(
        queryString ? `/admin/agencies?${queryString}` : '/admin/agencies',
        { scroll: false }
      );
    },
    [router]
  );

  // Track if this is the initial mount to avoid resetting page on first render
  const isInitialMount = useRef(true);

  // Update URL when debounced search changes
  useEffect(() => {
    updateURL(debouncedSearch, statusFilter, claimedFilter, currentPage);
  }, [debouncedSearch, statusFilter, claimedFilter, currentPage, updateURL]);

  // Reset to page 1 when filters change (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, claimedFilter]);

  // Filter agencies based on current filters
  const filteredAgencies = agencies.filter((agency) => {
    // Search filter
    if (
      debouncedSearch &&
      !agency.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    ) {
      return false;
    }

    // Status filter
    if (statusFilter === 'active' && !agency.is_active) return false;
    if (statusFilter === 'inactive' && agency.is_active) return false;

    // Claimed filter
    if (claimedFilter === 'yes' && !agency.is_claimed) return false;
    if (claimedFilter === 'no' && agency.is_claimed) return false;

    return true;
  });

  // Calculate pagination
  const totalFiltered = filteredAgencies.length;
  const totalPages = Math.ceil(totalFiltered / AGENCIES_PER_PAGE);
  const validCurrentPage = Math.min(
    Math.max(1, currentPage),
    Math.max(1, totalPages)
  );
  const startIndex = (validCurrentPage - 1) * AGENCIES_PER_PAGE;
  const endIndex = Math.min(startIndex + AGENCIES_PER_PAGE, totalFiltered);
  const paginatedAgencies = filteredAgencies.slice(startIndex, endIndex);

  const hasActiveFilters =
    searchTerm !== '' || statusFilter !== 'all' || claimedFilter !== 'all';

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setClaimedFilter('all');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="rounded-industrial-base border-2 border-industrial-graphite-200">
      <div className="border-b-2 border-industrial-graphite-200 bg-industrial-graphite-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-industrial-graphite-400" />
            <Input
              placeholder="Search agencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="agency-search-input"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            data-testid="status-filter"
          >
            <SelectTrigger
              className="w-[140px]"
              data-testid="status-filter-trigger"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={claimedFilter}
            onValueChange={setClaimedFilter}
            data-testid="claimed-filter"
          >
            <SelectTrigger
              className="w-[140px]"
              data-testid="claimed-filter-trigger"
            >
              <SelectValue placeholder="Claimed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Claimed</SelectItem>
              <SelectItem value="yes">Claimed</SelectItem>
              <SelectItem value="no">Unclaimed</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10"
              data-testid="clear-filters-button"
            >
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Claimed</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Completion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedAgencies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-industrial-graphite-500">
                  <Building2 className="h-8 w-8 mb-2" />
                  <span className="font-body">
                    {hasActiveFilters
                      ? 'No agencies match your filters.'
                      : 'No agencies found.'}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            paginatedAgencies.map((agency) => (
              <TableRow key={agency.id} data-testid={`agency-row-${agency.id}`}>
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/agencies/${agency.id}`}
                    className="font-body font-semibold text-industrial-orange hover:text-industrial-orange-500 hover:underline"
                  >
                    {agency.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={agency.is_active ? 'default' : 'secondary'}
                    data-testid={`status-badge-${agency.id}`}
                  >
                    {agency.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={agency.is_claimed ? 'default' : 'outline'}
                    data-testid={`claimed-badge-${agency.id}`}
                  >
                    {agency.is_claimed ? 'Claimed' : 'Unclaimed'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {agency.owner_profile ? (
                    <span className="font-body text-sm text-industrial-graphite-600">
                      {agency.owner_profile.full_name ||
                        agency.owner_profile.email ||
                        'Unknown'}
                    </span>
                  ) : (
                    <span className="font-body text-industrial-graphite-400 text-sm">
                      —
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-body text-sm text-industrial-graphite-500">
                  {formatDate(agency.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`text-sm font-medium ${getProfileCompletionColor(
                      agency.profile_completion_percentage ?? 0
                    )}`}
                  >
                    {agency.profile_completion_percentage ?? 0}%
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="border-t-2 border-industrial-graphite-200 p-4 flex items-center justify-between font-body text-sm text-industrial-graphite-500">
        <span data-testid="agencies-count">
          {totalFiltered === 0
            ? 'Showing 0 of 0 agencies'
            : `Showing ${startIndex + 1}-${endIndex} of ${totalFiltered} agencies`}
        </span>
        {totalPages > 1 && (
          <div
            className="flex items-center gap-2"
            data-testid="pagination-controls"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={validCurrentPage === 1}
              data-testid="pagination-previous"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span
              className="font-body text-sm text-industrial-graphite-600"
              data-testid="pagination-info"
            >
              Page {validCurrentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={validCurrentPage === totalPages}
              data-testid="pagination-next"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
