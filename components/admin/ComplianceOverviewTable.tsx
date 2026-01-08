'use client';

/**
 * ComplianceOverviewTable Component
 * Feature: 013-industry-compliance-and-verification
 * Task: 6.1.6 - Create Admin Compliance Overview Page
 *
 * Displays table of agencies with compliance issues for admin monitoring
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
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
import { Button } from '@/components/ui/button';
import { Search, ExternalLink, FileWarning } from 'lucide-react';
import { COMPLIANCE_DISPLAY_NAMES, type ComplianceType } from '@/types/api';

interface ComplianceDataRow {
  id: string;
  agency_id: string;
  compliance_type: ComplianceType;
  is_active: boolean;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  document_url: string | null;
  expiration_date: string | null;
  notes: string | null;
  agencies: {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
  };
}

interface ComplianceOverviewTableProps {
  complianceData: ComplianceDataRow[];
}

type FilterStatus =
  | 'all'
  | 'expired'
  | 'expiring_soon'
  | 'pending_verification';

/**
 * Calculate days until expiration using UTC to avoid timezone issues
 */
function daysUntilExpiration(expirationDate: string): number {
  const today = new Date();
  const todayUTC = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );

  const expDate = new Date(expirationDate);
  const expDateUTC = Date.UTC(
    expDate.getUTCFullYear(),
    expDate.getUTCMonth(),
    expDate.getUTCDate()
  );

  const diffTime = expDateUTC - todayUTC;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determine status of compliance item
 */
function getComplianceStatus(
  item: ComplianceDataRow
): 'expired' | 'expiring_soon' | 'pending_verification' | 'ok' {
  if (!item.is_verified && item.document_url) {
    return 'pending_verification';
  }

  if (item.expiration_date) {
    const days = daysUntilExpiration(item.expiration_date);
    if (days < 0) return 'expired';
    if (days <= 30) return 'expiring_soon';
  }

  return 'ok';
}

/**
 * Get badge variant for status
 */
function getStatusBadgeVariant(
  status: string
): 'destructive' | 'warning' | 'secondary' {
  if (status === 'expired') return 'destructive';
  if (status === 'expiring_soon') return 'warning';
  return 'secondary';
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ComplianceOverviewTable({
  complianceData,
}: ComplianceOverviewTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  // Filter and search compliance data
  const filteredData = useMemo(() => {
    return complianceData.filter((item) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        item.agencies.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        COMPLIANCE_DISPLAY_NAMES[item.compliance_type]
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'all') return true;

      const status = getComplianceStatus(item);
      return status === statusFilter;
    });
  }, [complianceData, searchQuery, statusFilter]);

  // Count items by status
  const statusCounts = useMemo(() => {
    return {
      expired: complianceData.filter(
        (item) => getComplianceStatus(item) === 'expired'
      ).length,
      expiring_soon: complianceData.filter(
        (item) => getComplianceStatus(item) === 'expiring_soon'
      ).length,
      pending_verification: complianceData.filter(
        (item) => getComplianceStatus(item) === 'pending_verification'
      ).length,
    };
  }, [complianceData]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-industrial-graphite-400" />
          <Input
            placeholder="Search by agency or compliance type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as FilterStatus)}
        >
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All Issues ({complianceData.length})
            </SelectItem>
            <SelectItem value="expired">
              Expired ({statusCounts.expired})
            </SelectItem>
            <SelectItem value="expiring_soon">
              Expiring Soon ({statusCounts.expiring_soon})
            </SelectItem>
            <SelectItem value="pending_verification">
              Pending Verification ({statusCounts.pending_verification})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredData.length === 0 ? (
        <div className="bg-industrial-bg-card border-2 border-industrial-graphite-200 rounded-industrial-sharp p-8 text-center">
          <FileWarning className="h-12 w-12 text-industrial-graphite-300 mx-auto mb-4" />
          <h3 className="font-display text-lg uppercase tracking-wide text-industrial-graphite-600 mb-2">
            {statusFilter === 'all'
              ? 'No Compliance Issues'
              : 'No Items Match Filter'}
          </h3>
          <p className="font-body text-sm text-industrial-graphite-400">
            {statusFilter === 'all'
              ? 'All agencies are in good compliance standing.'
              : 'Try adjusting your filters or search query.'}
          </p>
        </div>
      ) : (
        <div className="border-2 border-industrial-graphite-200 rounded-industrial-sharp overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-display uppercase text-xs">
                  Agency
                </TableHead>
                <TableHead className="font-display uppercase text-xs">
                  Compliance Type
                </TableHead>
                <TableHead className="font-display uppercase text-xs">
                  Status
                </TableHead>
                <TableHead className="font-display uppercase text-xs">
                  Expiration Date
                </TableHead>
                <TableHead className="font-display uppercase text-xs text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => {
                const status = getComplianceStatus(item);
                const days = item.expiration_date
                  ? daysUntilExpiration(item.expiration_date)
                  : null;

                return (
                  <TableRow key={item.id}>
                    {/* Agency Name */}
                    <TableCell className="font-body font-semibold">
                      {item.agencies.name}
                    </TableCell>

                    {/* Compliance Type */}
                    <TableCell className="font-body text-sm">
                      {COMPLIANCE_DISPLAY_NAMES[item.compliance_type]}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={getStatusBadgeVariant(status)}>
                          {status === 'expired' && 'Expired'}
                          {status === 'expiring_soon' && 'Expiring Soon'}
                          {status === 'pending_verification' &&
                            'Pending Verification'}
                        </Badge>
                        {days !== null && status !== 'pending_verification' && (
                          <span className="text-xs text-industrial-graphite-400">
                            {days < 0
                              ? `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`
                              : `${days} ${days === 1 ? 'day' : 'days'} remaining`}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Expiration Date */}
                    <TableCell className="font-body text-sm">
                      {item.expiration_date ? (
                        formatDate(item.expiration_date)
                      ) : (
                        <span className="text-industrial-graphite-400">
                          N/A
                        </span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Link href={`/admin/agencies/${item.agency_id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          View Agency
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Results summary */}
      {filteredData.length > 0 && (
        <p className="font-body text-sm text-industrial-graphite-400 text-center">
          Showing {filteredData.length} of {complianceData.length} compliance
          issues
        </p>
      )}
    </div>
  );
}
