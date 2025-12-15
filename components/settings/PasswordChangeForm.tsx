'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2, Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react';

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(128, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

interface PasswordChangeFormProps {
  currentEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PasswordChangeForm({
  currentEmail,
  open,
  onOpenChange,
  onSuccess,
}: PasswordChangeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const wasOpenRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Reset form when dialog transitions closed -> open
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowSuccess(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
    wasOpenRef.current = open;
  }, [open, reset]);

  const onSubmit = async (data: PasswordChangeFormData) => {
    setIsSubmitting(true);

    try {
      // First verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: data.currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password (user remains logged in)
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) {
        // Handle specific error cases
        if (updateError.message.includes('same as the old password')) {
          throw new Error(
            'New password must be different from your current password'
          );
        }
        throw updateError;
      }

      // Show success state
      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error(
        'Error changing password:',
        error instanceof Error ? error.message : 'Unknown error'
      );

      toast({
        variant: 'destructive',
        title: 'Error changing password',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to change password. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowSuccess(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowSuccess(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {showSuccess ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-center">
                Password Changed Successfully
              </DialogTitle>
              <DialogDescription className="text-center">
                <div className="space-y-2">
                  <div>Your password has been updated successfully.</div>
                  <div className="font-medium">
                    You remain logged in and can continue using your account.
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Got it
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and choose a new password to
                continue.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">
                  Current Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...register('currentPassword')}
                    placeholder="Enter your current password"
                    disabled={isSubmitting}
                    autoComplete="current-password"
                    aria-invalid={errors.currentPassword ? 'true' : 'false'}
                    aria-describedby={
                      errors.currentPassword
                        ? 'currentPassword-error'
                        : undefined
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showCurrentPassword
                        ? 'Hide current password'
                        : 'Show current password'
                    }
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p
                    id="currentPassword-error"
                    className="text-sm text-red-600"
                    role="alert"
                  >
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newPassword">
                  New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    {...register('newPassword')}
                    placeholder="Enter your new password"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                    aria-invalid={errors.newPassword ? 'true' : 'false'}
                    aria-describedby={
                      errors.newPassword ? 'newPassword-error' : undefined
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showNewPassword
                        ? 'Hide new password'
                        : 'Show new password'
                    }
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p
                    id="newPassword-error"
                    className="text-sm text-red-600"
                    role="alert"
                  >
                    {errors.newPassword.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">
                  Confirm New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    placeholder="Confirm your new password"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                    aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                    aria-describedby={
                      errors.confirmPassword
                        ? 'confirmPassword-error'
                        : undefined
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p
                    id="confirmPassword-error"
                    className="text-sm text-red-600"
                    role="alert"
                  >
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? 'Changing...' : 'Change Password'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
