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
import { Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const deleteAccountSchema = z.object({
  confirmText: z.string().refine((val) => val === 'DELETE', {
    message: 'You must type DELETE to confirm',
  }),
  password: z.string().min(1, 'Password is required'),
});

type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;

interface DeleteAccountModalProps {
  currentEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountModal({
  currentEmail,
  open,
  onOpenChange,
}: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState<'confirm' | 'password'>('confirm');
  const { toast } = useToast();
  const router = useRouter();
  const wasOpenRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      confirmText: '',
      password: '',
    },
  });

  const confirmText = watch('confirmText');

  // Reset form when dialog transitions closed -> open
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      reset({ confirmText: '', password: '' });
      setStep('confirm');
    }
    wasOpenRef.current = open;
  }, [open, reset]);

  const onSubmit = async (data: DeleteAccountFormData) => {
    setIsDeleting(true);

    try {
      // Call the API route to delete the account
      // The API will verify the password and delete the user
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: data.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account');
      }

      // Show success message
      toast({
        title: 'Account deleted',
        description:
          'Your account has been permanently deleted. You will be redirected to the home page.',
      });

      // Sign out and redirect to home
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error(
        'Error deleting account:',
        error instanceof Error ? error.message : 'Unknown error'
      );

      toast({
        variant: 'destructive',
        title: 'Error deleting account',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to delete account. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    reset({ confirmText: '', password: '' });
    setStep('confirm');
    onOpenChange(false);
  };

  const handleNextStep = () => {
    if (confirmText === 'DELETE') {
      setStep('password');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-center text-red-600 dark:text-red-400">
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-center space-y-2">
              <div className="font-semibold text-red-600 dark:text-red-400">
                ⚠️ This action cannot be undone!
              </div>
              <div>
                This will permanently delete your account and all associated
                data.
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Step 1: Confirmation Text */}
            <div className="grid gap-2">
              <Label htmlFor="confirmText">
                Type <span className="font-mono font-bold">DELETE</span> to
                confirm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmText"
                type="text"
                {...register('confirmText')}
                placeholder="Type DELETE"
                disabled={isDeleting}
                autoComplete="off"
                aria-invalid={errors.confirmText ? 'true' : 'false'}
                aria-describedby={
                  errors.confirmText ? 'confirmText-error' : undefined
                }
                className={
                  confirmText === 'DELETE'
                    ? 'border-green-500'
                    : errors.confirmText
                      ? 'border-red-500'
                      : ''
                }
              />
              {errors.confirmText && (
                <p
                  id="confirmText-error"
                  className="text-sm text-red-600"
                  role="alert"
                >
                  {errors.confirmText.message}
                </p>
              )}
            </div>

            {/* Step 2: Password (only show if DELETE typed) */}
            {step === 'password' && (
              <div className="grid gap-2">
                <Label htmlFor="password">
                  Enter your password to confirm{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Enter your password"
                  disabled={isDeleting}
                  autoComplete="current-password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={
                    errors.password ? 'password-error' : undefined
                  }
                />
                {errors.password && (
                  <p
                    id="password-error"
                    className="text-sm text-red-600"
                    role="alert"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>
            )}

            {/* Warning box */}
            <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-900 dark:text-red-100">
                <strong>This will delete:</strong>
              </p>
              <ul className="mt-2 text-sm text-red-900 dark:text-red-100 list-disc list-inside space-y-1">
                <li>Your profile and account settings</li>
                <li>All data associated with {currentEmail}</li>
                <li>Your login access permanently</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            {step === 'confirm' ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleNextStep}
                disabled={confirmText !== 'DELETE'}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                variant="destructive"
                disabled={isDeleting || confirmText !== 'DELETE'}
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isDeleting ? 'Deleting Account...' : 'Delete My Account'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
