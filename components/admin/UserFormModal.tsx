'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole } from '@/types/database';

/**
 * Validation schema for user creation/edit form
 */
const userFormSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Must be a valid email address'),
  full_name: z
    .string()
    .trim()
    .max(200, 'Name must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  role: z.enum(['user', 'agency_owner', 'admin'], {
    errorMap: () => ({
      message: 'Role must be user, agency_owner, or admin',
    }),
  }),
});

type UserFormData = z.infer<typeof userFormSchema>;

export interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user?: {
    id: string;
    email: string;
    full_name?: string | null;
    role: UserRole;
  };
}

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] =
  [
    {
      value: 'user',
      label: 'User',
      description: 'Standard user with basic access',
    },
    {
      value: 'agency_owner',
      label: 'Agency Owner',
      description: 'Can manage their claimed agency',
    },
    {
      value: 'admin',
      label: 'Admin',
      description: 'Full access to all features',
    },
  ];

export function UserFormModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: UserFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!user;

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    mode: 'onBlur',
    defaultValues: {
      email: user?.email || '',
      full_name: user?.full_name || '',
      role: user?.role || 'user',
    },
  });

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        email: user?.email || '',
        full_name: user?.full_name || '',
        role: user?.role || 'user',
      });
    }
  }, [isOpen, user, form]);

  const handleSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);

    try {
      const endpoint = isEditMode
        ? `/api/admin/users/${user.id}`
        : '/api/admin/users';
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          full_name: data.full_name || null,
          role: data.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error?.message ||
            `Failed to ${isEditMode ? 'update' : 'create'} user`
        );
      }

      // Show success message
      if (isEditMode) {
        toast.success('User Updated', {
          description: `${data.email} has been updated successfully.`,
        });
      } else {
        const resetSent = result.passwordResetSent
          ? ' A password reset email has been sent.'
          : '';
        toast.success('User Created', {
          description: `${data.email} has been created successfully.${resetSent}`,
        });
      }

      // Reset form and close modal
      form.reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error(isEditMode ? 'Update Failed' : 'Creation Failed', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md"
        data-testid="user-form-modal"
        aria-describedby="user-form-description"
      >
        <DialogHeader>
          <DialogTitle data-testid="modal-title">
            {isEditMode ? 'Edit User' : 'Create User'}
          </DialogTitle>
          <DialogDescription id="user-form-description">
            {isEditMode
              ? 'Update user details below.'
              : 'Create a new user account. A password reset email will be sent.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
            data-testid="user-form"
          >
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      data-testid="email-input"
                      disabled={isEditMode}
                      {...field}
                    />
                  </FormControl>
                  {isEditMode && (
                    <FormDescription>
                      Email cannot be changed. Create a new user if needed.
                    </FormDescription>
                  )}
                  <FormMessage data-testid="email-error" />
                </FormItem>
              )}
            />

            {/* Full Name Field */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      data-testid="full-name-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage data-testid="full-name-error" />
                </FormItem>
              )}
            />

            {/* Role Field */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Role <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="role-select">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLE_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          data-testid={`role-option-${option.value}`}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {ROLE_OPTIONS.find((opt) => opt.value === field.value)
                      ?.description || 'Select a role for this user'}
                  </FormDescription>
                  <FormMessage data-testid="role-error" />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                data-testid="cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isValid || isSubmitting}
                data-testid="submit-button"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
