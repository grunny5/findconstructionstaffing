'use client';

import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';

const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditorProps {
  userId: string;
  currentName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newName: string) => void;
}

/**
 * Profile editor dialog for updating user's full name.
 * Uses React Hook Form with Zod validation and optimistic UI updates.
 */
export function ProfileEditor({
  userId,
  currentName,
  open,
  onOpenChange,
  onSuccess,
}: ProfileEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: currentName || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);

    try {
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: data.full_name })
        .eq('id', userId);

      if (error) throw error;

      // Success: optimistic UI update via callback
      onSuccess?.(data.full_name);

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });

      // Close dialog and reset form
      onOpenChange(false);
      reset({ full_name: data.full_name });
    } catch (error) {
      console.error(
        'Error updating profile:',
        error instanceof Error ? error.message : 'Unknown error'
      );

      toast({
        variant: 'destructive',
        title: 'Error updating profile',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset({ full_name: currentName || '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your full name. Click save when you are done.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                {...register('full_name')}
                placeholder="Enter your full name"
                disabled={isSubmitting}
                autoFocus
                aria-invalid={errors.full_name ? 'true' : 'false'}
                aria-describedby={
                  errors.full_name ? 'full_name-error' : undefined
                }
              />
              {errors.full_name && (
                <p
                  id="full_name-error"
                  className="text-sm text-red-600"
                  role="alert"
                >
                  {errors.full_name.message}
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
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
