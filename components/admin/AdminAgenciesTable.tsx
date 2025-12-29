'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { Search, Building2, X } from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import type { AdminAgency } from '@/app/(app)/admin/agencies/page';

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

  // Debounce search term
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Update URL when filters change
  const updateURL = useCallback(
    (search: string, status: string, claimed: string) => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status !== 'all') params.set('status', status);
      if (claimed !== 'all') params.set('claimed', claimed);

      const queryString = params.toString();
      router.push(queryString ? `?${queryString}` : '/admin/agencies', {
        scroll: false,
      });
    },
    [router]
  );

  // Update URL when debounced search changes
  useEffect(() => {
    updateURL(debouncedSearch, statusFilter, claimedFilter);
  }, [debouncedSearch, statusFilter, claimedFilter, updateURL]);

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

  const hasActiveFilters =
    searchTerm !== '' || statusFilter !== 'all' || claimedFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setClaimedFilter('all');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="rounded-md border">
      <div className="border-b bg-muted/50 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
          {filteredAgencies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Building2 className="h-8 w-8 mb-2" />
                  {hasActiveFilters
                    ? 'No agencies match your filters.'
                    : 'No agencies found.'}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredAgencies.map((agency) => (
              <TableRow key={agency.id} data-testid={`agency-row-${agency.id}`}>
                <TableCell className="font-medium">
                  <Link
                    href={`/recruiters/${agency.slug}`}
                    className="hover:underline text-primary"
                    target="_blank"
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
                    <span className="text-sm">
                      {agency.owner_profile.full_name ||
                        agency.owner_profile.email ||
                        'Unknown'}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(agency.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`text-sm font-medium ${
                      (agency.profile_completion_percentage ?? 0) >= 80
                        ? 'text-green-600'
                        : (agency.profile_completion_percentage ?? 0) >= 50
                          ? 'text-yellow-600'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {agency.profile_completion_percentage ?? 0}%
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="border-t p-4 flex items-center justify-between text-sm text-muted-foreground">
        <span data-testid="agencies-count">
          Showing {filteredAgencies.length} of {agencies.length} agencies
        </span>
      </div>
    </div>
  );
}
