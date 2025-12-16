'use client';

import { useState, useMemo } from 'react';
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
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { RoleChangeDropdown } from './RoleChangeDropdown';
import type { Profile, UserRole } from '@/types/database';

interface UsersTableProps {
  users: Profile[];
  currentUserId?: string;
}

const USERS_PER_PAGE = 50;

const roleBadgeVariant = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return 'destructive';
    case 'agency_owner':
      return 'default';
    default:
      return 'secondary';
  }
};

const roleDisplayName = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'agency_owner':
      return 'Agency Owner';
    default:
      return 'User';
  }
};

export function UsersTable({
  users: initialUsers,
  currentUserId,
}: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          (user.full_name && user.full_name.toLowerCase().includes(query))
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    return filtered;
  }, [users, searchQuery, roleFilter]);

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

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
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
      const { data, error } = await supabase.rpc('change_user_role', {
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="agency_owner">Agency Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paginatedUsers.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-gray-500">
            {filteredUsers.length === 0 && users.length > 0
              ? 'No users found matching your filters.'
              : 'No users found.'}
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
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
                        {user.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(user.role)}>
                          {roleDisplayName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {startIndex + 1}-
                {Math.min(endIndex, filteredUsers.length)} of{' '}
                {filteredUsers.length} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
