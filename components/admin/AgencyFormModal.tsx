'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  agencyCreationSchema,
  EMPLOYEE_COUNT_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  getFoundedYearOptions,
} from '@/lib/validations/agency-creation';
import type { AgencyCreationFormData } from '@/lib/validations/agency-creation';

export interface AgencyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  agency?: {
    id: string;
    name: string;
    description?: string | null;
    website?: string | null;
    phone?: string | null;
    email?: string | null;
    headquarters?: string | null;
    founded_year?: number | null;
    employee_count?: string | null;
    company_size?: string | null;
    offers_per_diem?: boolean | null;
    is_union?: boolean | null;
  };
}

export function AgencyFormModal({
  isOpen,
  onClose,
  onSuccess,
  agency,
}: AgencyFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!agency;
  const foundedYearOptions = useMemo(() => getFoundedYearOptions(), []);

  const form = useForm<AgencyCreationFormData>({
    resolver: zodResolver(agencyCreationSchema),
    mode: 'onBlur',
    defaultValues: {
      name: agency?.name || '',
      description: agency?.description || '',
      website: agency?.website || '',
      phone: agency?.phone || '',
      email: agency?.email || '',
      headquarters: agency?.headquarters || '',
      founded_year: agency?.founded_year?.toString() || '',
      employee_count:
        (agency?.employee_count as AgencyCreationFormData['employee_count']) ||
        '',
      company_size:
        (agency?.company_size as AgencyCreationFormData['company_size']) || '',
      offers_per_diem: agency?.offers_per_diem ?? false,
      is_union: agency?.is_union ?? false,
    },
  });

  useEffect(() => {
    const mappedValues: AgencyCreationFormData = {
      name: agency?.name || '',
      description: agency?.description || '',
      website: agency?.website || '',
      phone: agency?.phone || '',
      email: agency?.email || '',
      headquarters: agency?.headquarters || '',
      founded_year: agency?.founded_year?.toString() || '',
      employee_count:
        (agency?.employee_count as AgencyCreationFormData['employee_count']) ||
        '',
      company_size:
        (agency?.company_size as AgencyCreationFormData['company_size']) || '',
      offers_per_diem: agency?.offers_per_diem ?? false,
      is_union: agency?.is_union ?? false,
    };
    form.reset(mappedValues);
  }, [agency, form]);

  const handleSubmit = async (data: AgencyCreationFormData) => {
    setIsSubmitting(true);

    try {
      const endpoint = isEditMode
        ? `/api/admin/agencies/${agency.id}`
        : '/api/admin/agencies';

      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to save agency');
      }

      toast.success(isEditMode ? 'Agency Updated' : 'Agency Created', {
        description: isEditMode
          ? `${data.name} has been updated successfully.`
          : `${data.name} has been created successfully.`,
      });

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

  const handleCancel = () => {
    form.reset();
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-testid="agency-form-modal"
      >
        <DialogHeader>
          <DialogTitle data-testid="modal-title">
            {isEditMode ? 'Edit Agency' : 'Create Agency'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the agency details below.'
              : 'Fill in the details to create a new agency.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
            data-testid="agency-form"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Company Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter company name"
                      data-testid="name-input"
                    />
                  </FormControl>
                  <FormMessage data-testid="name-error" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the company and its services..."
                      rows={4}
                      data-testid="description-input"
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description of the company (max 5000 characters)
                  </FormDescription>
                  <FormMessage data-testid="description-error" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://www.example.com"
                        data-testid="website-input"
                      />
                    </FormControl>
                    <FormMessage data-testid="website-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="contact@example.com"
                        data-testid="email-input"
                      />
                    </FormControl>
                    <FormMessage data-testid="email-error" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+12345678900"
                        data-testid="phone-input"
                      />
                    </FormControl>
                    <FormDescription>E.164 format</FormDescription>
                    <FormMessage data-testid="phone-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="headquarters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headquarters</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="City, State"
                        data-testid="headquarters-input"
                      />
                    </FormControl>
                    <FormMessage data-testid="headquarters-error" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="founded_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Founded Year</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="founded-year-select">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {foundedYearOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="founded-year-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employee_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee Count</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="employee-count-select">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EMPLOYEE_COUNT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="employee-count-error" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="company_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Size</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="company-size-select">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMPANY_SIZE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage data-testid="company-size-error" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <FormField
                control={form.control}
                name="offers_per_diem"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Offers Per Diem</FormLabel>
                      <FormDescription>
                        Agency offers per diem pay
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="offers-per-diem-switch"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_union"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Union Agency</FormLabel>
                      <FormDescription>
                        Agency is union-affiliated
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="is-union-switch"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                data-testid="agency-form-cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isValid || isSubmitting}
                data-testid="submit-button"
              >
                {isSubmitting && (
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    data-testid="loading-spinner"
                  />
                )}
                {isEditMode ? 'Save Changes' : 'Create Agency'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
