'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Building2 } from 'lucide-react';
import Link from 'next/link';
import type { AdminAgency } from '@/app/(app)/admin/agencies/page';

interface AdminAgenciesTableProps {
  agencies: AdminAgency[];
}

export function AdminAgenciesTable({ agencies }: AdminAgenciesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAgencies = agencies.filter((agency) =>
    agency.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search agencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="agency-search-input"
            />
          </div>
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
                  {searchTerm
                    ? 'No agencies match your search.'
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
