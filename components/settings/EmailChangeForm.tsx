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
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';

const emailChangeSchema = z.object({
  newEmail: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
});

type EmailChangeFormData = z.infer<typeof emailChangeSchema>;

interface EmailChangeFormProps {
  currentEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EmailChangeForm({
  currentEmail,
  open,
  onOpenChange,
  onSuccess,
}: EmailChangeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const wasOpenRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<EmailChangeFormData>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: {
      newEmail: '',
      currentPassword: '',
    },
  });

  // Reset form when dialog transitions closed -> open
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      reset({ newEmail: '', currentPassword: '' });
      setShowSuccess(false);
    }
    wasOpenRef.current = open;
  }, [open, reset]);

  const onSubmit = async (data: EmailChangeFormData) => {
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

      // Update email (Supabase sends verification emails to both addresses)
      const { error: updateError } = await supabase.auth.updateUser({
        email: data.newEmail,
      });

      if (updateError) {
        // Handle specific error cases
        if (updateError.message.includes('already registered')) {
          throw new Error('This email address is already in use');
        }
        throw updateError;
      }

      // Show success state
      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error(
        'Error changing email:',
        error instanceof Error ? error.message : 'Unknown error'
      );

      toast({
        variant: 'destructive',
        title: 'Error changing email',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to change email. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset({ newEmail: '', currentPassword: '' });
    setShowSuccess(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    reset({ newEmail: '', currentPassword: '' });
    setShowSuccess(false);
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
                Verification Emails Sent
              </DialogTitle>
              <DialogDescription className="text-center space-y-2">
                <p>
                  We&apos;ve sent verification emails to both your current and new
                  email addresses.
                </p>
                <p className="font-medium">
                  Click the link in your new email to confirm the change.
                </p>
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
              <DialogTitle>Change Email Address</DialogTitle>
              <DialogDescription>
                Enter your new email address and current password to continue.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="current_email">Current Email</Label>
                <div className="flex items-center px-3 py-2 text-sm border rounded-md bg-muted">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  {currentEmail}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newEmail">
                  New Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="newEmail"
                  type="email"
                  {...register('newEmail')}
                  placeholder="your.new@email.com"
                  disabled={isSubmitting}
                  autoComplete="email"
                  aria-invalid={errors.newEmail ? 'true' : 'false'}
                  aria-describedby={errors.newEmail ? 'newEmail-error' : undefined}
                />
                {errors.newEmail && (
                  <p
                    id="newEmail-error"
                    className="text-sm text-red-600"
                    role="alert"
                  >
                    {errors.newEmail.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currentPassword">
                  Current Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...register('currentPassword')}
                  placeholder="Enter your current password"
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  aria-invalid={errors.currentPassword ? 'true' : 'false'}
                  aria-describedby={
                    errors.currentPassword ? 'currentPassword-error' : undefined
                  }
                />
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
                {isSubmitting ? 'Verifying...' : 'Change Email'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
