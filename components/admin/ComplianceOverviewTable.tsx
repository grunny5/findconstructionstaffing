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
import { useRouter } from 'next/navigation';
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
import { Search, ExternalLink, FileWarning, FileCheck } from 'lucide-react';
import {
  COMPLIANCE_DISPLAY_NAMES,
  type ComplianceType,
  type AgencyComplianceRow,
  isComplianceExpired,
} from '@/types/api';
import { ComplianceVerifyDialog } from '@/components/admin/ComplianceVerifyDialog';

/**
 * Extended compliance row type that includes joined agency data
 * Reuses AgencyComplianceRow from types/api.ts and adds the nested agencies object
 */
interface ComplianceDataRow
  extends Omit<AgencyComplianceRow, 'created_at' | 'updated_at'> {
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
 * Priority: expired > expiring_soon > pending_verification > ok
 * Expiration is more urgent than verification status
 */
function getComplianceStatus(
  item: ComplianceDataRow
): 'expired' | 'expiring_soon' | 'pending_verification' | 'ok' {
  // Check expiration first - expired items are highest priority
  if (item.expiration_date) {
    const days = daysUntilExpiration(item.expiration_date);
    if (days < 0) return 'expired';
    if (days <= 30) return 'expiring_soon';
  }

  // Check verification status after expiration
  if (!item.is_verified && item.document_url) {
    return 'pending_verification';
  }

  return 'ok';
}

/**
 * Get badge variant for status
 */
function getStatusBadgeVariant(
  status: string
): 'destructive' | 'outline' | 'secondary' {
  if (status === 'expired') return 'destructive';
  if (status === 'expiring_soon') return 'outline';
  return 'secondary';
}

/**
 * Format date for display (using UTC to match daysUntilExpiration)
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function ComplianceOverviewTable({
  complianceData,
}: ComplianceOverviewTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedCompliance, setSelectedCompliance] = useState<ComplianceDataRow | null>(null);

  const handleVerificationComplete = () => {
    setVerifyDialogOpen(false);
    setSelectedCompliance(null);
    router.refresh(); // Refresh data using Next.js App Router
  };

  // Pre-compute status for all items once (performance optimization)
  // This avoids O(n*4) status calculations on every filter change
  const statusMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getComplianceStatus>>();
    complianceData.forEach((item) => {
      map.set(item.id, getComplianceStatus(item));
    });
    return map;
  }, [complianceData]);

  // Filter and search compliance data using pre-computed status
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

      // Status filter using pre-computed status (O(1) lookup)
      if (statusFilter === 'all') return true;

      const status = statusMap.get(item.id);
      return status === statusFilter;
    });
  }, [complianceData, searchQuery, statusFilter, statusMap]);

  // Count items by status using pre-computed Map (single pass)
  const statusCounts = useMemo(() => {
    const counts = {
      expired: 0,
      expiring_soon: 0,
      pending_verification: 0,
    };

    statusMap.forEach((status) => {
      if (status === 'expired') counts.expired++;
      else if (status === 'expiring_soon') counts.expiring_soon++;
      else if (status === 'pending_verification') counts.pending_verification++;
    });

    return counts;
  }, [statusMap]);

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
            aria-label="Search by agency or compliance type"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as FilterStatus)}
        >
          <SelectTrigger
            className="w-full sm:w-[250px]"
            aria-label="Filter compliance status"
          >
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
                const status = statusMap.get(item.id)!; // Use pre-computed status (O(1) lookup)
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
                          {status === 'ok' && 'Active'}
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
                      <div className="flex items-center justify-end gap-2">
                        {/* Review button for pending verification */}
                        {status === 'pending_verification' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedCompliance(item);
                              setVerifyDialogOpen(true);
                            }}
                          >
                            <FileCheck className="h-3 w-3 mr-2" />
                            Review
                          </Button>
                        )}

                        {/* View Agency button */}
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/admin/agencies/${item.agency_id}`}
                            className="gap-2"
                          >
                            View Agency
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </Link>
                        </Button>
                      </div>
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

      {/* Verification Dialog */}
      {selectedCompliance && (
        <ComplianceVerifyDialog
          isOpen={verifyDialogOpen}
          complianceItem={{
            id: selectedCompliance.id,
            type: selectedCompliance.compliance_type,
            displayName: COMPLIANCE_DISPLAY_NAMES[selectedCompliance.compliance_type],
            isActive: selectedCompliance.is_active,
            isVerified: selectedCompliance.is_verified,
            expirationDate: selectedCompliance.expiration_date,
            isExpired: isComplianceExpired(selectedCompliance.expiration_date),
            documentUrl: selectedCompliance.document_url,
            notes: selectedCompliance.notes,
            verifiedBy: selectedCompliance.verified_by,
            verifiedAt: selectedCompliance.verified_at,
          }}
          agencyId={selectedCompliance.agency_id}
          agencyName={selectedCompliance.agencies.name}
          onComplete={handleVerificationComplete}
          onClose={() => {
            setVerifyDialogOpen(false);
            setSelectedCompliance(null);
          }}
        />
      )}
    </div>
  );
}
