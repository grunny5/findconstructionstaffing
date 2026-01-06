'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
import { Search, ChevronLeft, ChevronRight, X, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { RoleChangeDropdown } from './RoleChangeDropdown';
import { roleDisplayName, roleBadgeVariant } from '@/lib/utils/role';
import { useDebounce } from '@/hooks/use-debounce';
import type { Profile, UserRole } from '@/types/database';

interface UsersTableProps {
  users: Profile[];
  currentUserId?: string;
}

const USERS_PER_PAGE = 50;

export function UsersTable({
  users: initialUsers,
  currentUserId,
}: UsersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [users, setUsers] = useState(initialUsers);

  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );
  const [roleFilter, setRoleFilter] = useState<string>(
    searchParams.get('role') || 'all'
  );
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get('page');
    const parsed = pageParam ? parseInt(pageParam, 10) : 1;
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  });

  // Debounce search term (300ms)
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Update URL when filters change
  const updateURL = useCallback(
    (search: string, role: string, page: number) => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (role !== 'all') params.set('role', role);
      if (page > 1) params.set('page', page.toString());

      const queryString = params.toString();
      router.push(
        queryString ? `/admin/users?${queryString}` : '/admin/users',
        { scroll: false }
      );
    },
    [router]
  );

  // Track previous filter values to detect filter changes vs page changes
  const prevFiltersRef = useRef({ search: debouncedSearch, role: roleFilter });
  const isInitialMount = useRef(true);

  // Single effect to handle URL updates
  useEffect(() => {
    // Skip URL push on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevFiltersRef.current = { search: debouncedSearch, role: roleFilter };
      return;
    }

    const filtersChanged =
      prevFiltersRef.current.search !== debouncedSearch ||
      prevFiltersRef.current.role !== roleFilter;

    if (filtersChanged) {
      // Filters changed: reset to page 1 and update URL
      prevFiltersRef.current = { search: debouncedSearch, role: roleFilter };
      setCurrentPage(1);
      updateURL(debouncedSearch, roleFilter, 1);
    } else {
      // Only page changed: update URL with current page
      updateURL(debouncedSearch, roleFilter, currentPage);
    }
  }, [debouncedSearch, roleFilter, currentPage, updateURL]);

  // Filter users based on current filters
  const filteredUsers = users.filter((user) => {
    // Search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      const matchesName =
        user.full_name && user.full_name.toLowerCase().includes(query);
      const matchesEmail = user.email.toLowerCase().includes(query);
      if (!matchesName && !matchesEmail) {
        return false;
      }
    }

    // Role filter
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false;
    }

    return true;
  });

  const hasActiveFilters = searchQuery !== '' || roleFilter !== 'all';

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
  };

  const handleRoleChange = async (
    userId: string,
    newRole: UserRole,
    notes?: string
  ) => {
    if (userId === currentUserId) {
      toast({
        title: 'Error',
        description: 'You cannot change your own role.',
        variant: 'destructive',
      });
      return;
    }

    const userToUpdate = users.find((u) => u.id === userId);
    if (!userToUpdate) return;

    const oldRole = userToUpdate.role;

    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );

    try {
      const { error } = await supabase.rpc('change_user_role', {
        target_user_id: userId,
        new_role: newRole,
        admin_notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Role updated from ${roleDisplayName(oldRole)} to ${roleDisplayName(newRole)}.`,
      });
    } catch (error: any) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: oldRole } : user
        )
      );

      toast({
        title: 'Error',
        description:
          error.message || 'Failed to update role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="rounded-industrial-base border-2 border-industrial-graphite-200">
      <div className="border-b-2 border-industrial-graphite-200 bg-industrial-graphite-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-industrial-graphite-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="user-search-input"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={setRoleFilter}
            data-testid="role-filter"
          >
            <SelectTrigger
              className="w-[180px]"
              data-testid="role-filter-trigger"
            >
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="agency_owner">Agency Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
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

      {paginatedUsers.length === 0 ? (
        <div className="p-12 text-center">
          <div className="flex flex-col items-center justify-center text-industrial-graphite-500">
            <Users className="h-8 w-8 mb-2" />
            <span className="font-body">
              {hasActiveFilters
                ? 'No users match your filters.'
                : 'No users found.'}
            </span>
          </div>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="font-body font-semibold text-industrial-orange hover:text-industrial-orange-500 hover:underline"
                    >
                      {user.full_name || 'N/A'}
                    </Link>
                  </TableCell>
                  <TableCell className="font-body text-industrial-graphite-600">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant(user.role)}>
                      {roleDisplayName(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-body text-sm text-industrial-graphite-500">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <RoleChangeDropdown
                      userId={user.id}
                      userName={user.full_name}
                      currentRole={user.role}
                      onRoleChange={handleRoleChange}
                      disabled={user.id === currentUserId}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      <div className="border-t-2 border-industrial-graphite-200 p-4 flex items-center justify-between font-body text-sm text-industrial-graphite-500">
        <span data-testid="users-count">
          {filteredUsers.length === 0
            ? 'Showing 0 of 0 users'
            : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredUsers.length)} of ${filteredUsers.length} users`}
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
              disabled={currentPage === 1}
              data-testid="pagination-previous"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span
              className="font-body text-sm text-industrial-graphite-600"
              data-testid="pagination-info"
            >
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
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
