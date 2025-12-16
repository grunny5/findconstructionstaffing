'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RoleChangeConfirmModal } from './RoleChangeConfirmModal';
import type { UserRole } from '@/types/database';

interface RoleChangeDropdownProps {
  userId: string;
  userName: string | null;
  currentRole: UserRole;
  onRoleChange: (
    userId: string,
    newRole: UserRole,
    notes?: string
  ) => Promise<void>;
  disabled?: boolean;
}

const roleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'agency_owner':
      return 'Agency Owner';
    default:
      return 'User';
  }
};

export function RoleChangeDropdown({
  userId,
  userName,
  currentRole,
  onRoleChange,
  disabled = false,
}: RoleChangeDropdownProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectRole = (value: UserRole) => {
    if (value !== currentRole) {
      setSelectedRole(value);
      setIsModalOpen(true);
    }
  };

  const handleConfirm = async (notes?: string) => {
    if (!selectedRole) return;

    await onRoleChange(userId, selectedRole, notes);
    setIsModalOpen(false);
    setSelectedRole(null);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
  };

  return (
    <>
      <Select
        value={currentRole}
        onValueChange={handleSelectRole}
        disabled={disabled}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="agency_owner">Agency Owner</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>

      {selectedRole && (
        <RoleChangeConfirmModal
          isOpen={isModalOpen}
          userName={userName || 'Unknown User'}
          oldRole={currentRole}
          newRole={selectedRole}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
