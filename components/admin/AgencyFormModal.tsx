'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { TradeSelector } from '@/components/dashboard/TradeSelector';
import { RegionSelector } from '@/components/dashboard/RegionSelector';
import { LogoUpload } from '@/components/admin/LogoUpload';
import { ComplianceSettings } from '@/components/compliance/ComplianceSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Trade, Region } from '@/types/supabase';
import type { ComplianceItemFull } from '@/types/api';

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
    verified?: boolean | null;
    logo_url?: string | null;
    trades?: Trade[];
    regions?: Region[];
  };
}

export function AgencyFormModal({
  isOpen,
  onClose,
  onSuccess,
  agency,
}: AgencyFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTrades, setSelectedTrades] = useState<Trade[]>(
    agency?.trades || []
  );
  const [selectedRegions, setSelectedRegions] = useState<Region[]>(
    agency?.regions || []
  );
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'compliance'>(
    'details'
  );
  const [complianceData, setComplianceData] = useState<ComplianceItemFull[]>(
    []
  );
  const [isLoadingCompliance, setIsLoadingCompliance] = useState(false);
  const isEditMode = !!agency;
  const foundedYearOptions = useMemo(() => getFoundedYearOptions(), []);

  // Track external state changes (trades, regions, logo) for Save button
  const hasExternalChanges = useMemo(() => {
    if (!isEditMode || !agency) return false;

    // Check if trades have changed
    const initialTradeIds = (agency.trades || []).map((t) => t.id).sort();
    const currentTradeIds = selectedTrades.map((t) => t.id).sort();
    const tradesChanged =
      initialTradeIds.length !== currentTradeIds.length ||
      !initialTradeIds.every((id, i) => id === currentTradeIds[i]);

    // Check if regions have changed
    const initialRegionIds = (agency.regions || []).map((r) => r.id).sort();
    const currentRegionIds = selectedRegions.map((r) => r.id).sort();
    const regionsChanged =
      initialRegionIds.length !== currentRegionIds.length ||
      !initialRegionIds.every((id, i) => id === currentRegionIds[i]);

    // Check if logo has been added, removed, or changed
    const logoChanged = !!pendingLogoFile || logoRemoved;

    return tradesChanged || regionsChanged || logoChanged;
  }, [isEditMode, agency, selectedTrades, selectedRegions, pendingLogoFile, logoRemoved]);

  const form = useForm<AgencyCreationFormData>({
    resolver: zodResolver(agencyCreationSchema),
    mode: 'onChange',
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
      verified: agency?.verified ?? false,
    },
  });

  const fetchComplianceData = useCallback(async () => {
    if (!isEditMode || !agency?.id) return;

    setIsLoadingCompliance(true);
    try {
      const response = await fetch(
        `/api/admin/agencies/${agency.id}/compliance`
      );
      if (response.ok) {
        const result = await response.json();
        setComplianceData(result.data || []);
      } else {
        const result = await response.json().catch(() => ({}));
        console.error('Failed to fetch compliance data:', result.error);
        toast.error('Failed to Load Compliance', {
          description:
            result.error?.message || 'Unable to load compliance data.',
        });
      }
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
      toast.error('Failed to Load Compliance', {
        description: 'A network error occurred while loading compliance data.',
      });
    } finally {
      setIsLoadingCompliance(false);
    }
  }, [isEditMode, agency?.id]);

  const saveComplianceData = async (
    updatedCompliance: Array<{
      type: string;
      isActive: boolean;
      expirationDate: string | null;
    }>
  ) => {
    if (!isEditMode || !agency?.id) return;

    try {
      const response = await fetch(
        `/api/admin/agencies/${agency.id}/compliance`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: updatedCompliance }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save compliance data');
      }

      const result = await response.json();
      // Update local state with the response
      if (result.data) {
        setComplianceData(result.data);
      }

      toast.success('Compliance Updated', {
        description: 'Compliance settings have been saved successfully.',
      });
    } catch (error) {
      toast.error('Update Failed', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

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
      verified: agency?.verified ?? false,
    };
    form.reset(mappedValues);
    setSelectedTrades(agency?.trades || []);
    setSelectedRegions(agency?.regions || []);
    setPendingLogoFile(null);
    setLogoRemoved(false);
    setLogoUploadError(null);
    setActiveTab('details');

    // Fetch compliance data for edit mode
    if (isEditMode) {
      fetchComplianceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agency?.id, isOpen]);

  const handleLogoFileSelect = (file: File | null) => {
    setLogoUploadError(null);
    if (file) {
      setPendingLogoFile(file);
      setLogoRemoved(false);
    } else {
      setPendingLogoFile(null);
      // If there was an existing logo and user removed the selection, mark as removed
      if (agency?.logo_url) {
        setLogoRemoved(true);
      }
    }
  };

  const uploadLogo = async (agencyId: string): Promise<boolean> => {
    if (!pendingLogoFile) return true;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', pendingLogoFile);

      const response = await fetch(`/api/admin/agencies/${agencyId}/logo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || 'Failed to upload logo');
      }

      return true;
    } catch (error) {
      setLogoUploadError(
        error instanceof Error ? error.message : 'Failed to upload logo'
      );
      return false;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removeLogo = async (agencyId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/agencies/${agencyId}/logo`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || 'Failed to remove logo');
      }

      return true;
    } catch (error) {
      setLogoUploadError(
        error instanceof Error ? error.message : 'Failed to remove logo'
      );
      return false;
    }
  };

  const handleSubmit = async (data: AgencyCreationFormData) => {
    setIsSubmitting(true);
    setLogoUploadError(null);

    try {
      const endpoint = isEditMode
        ? `/api/admin/agencies/${agency.id}`
        : '/api/admin/agencies';

      const method = isEditMode ? 'PATCH' : 'POST';

      // Include trade_ids and region_ids in the request body
      const requestBody: Record<string, any> = {
        ...data,
      };

      // In edit mode, only send trades/regions if they've changed to avoid RLS issues
      if (!isEditMode) {
        // Create mode: always send trades and regions
        requestBody.trade_ids = selectedTrades.map((t) => t.id);
        requestBody.region_ids = selectedRegions.map((r) => r.id);
      } else {
        // Edit mode: check if trades have changed
        const currentTradeIds = agency?.trades?.map((t) => t.id).sort() || [];
        const selectedTradeIds = selectedTrades.map((t) => t.id).sort();
        const tradesChanged =
          currentTradeIds.length !== selectedTradeIds.length ||
          !currentTradeIds.every((id, i) => id === selectedTradeIds[i]);

        if (tradesChanged) {
          requestBody.trade_ids = selectedTrades.map((t) => t.id);
        }

        // Check if regions have changed
        const currentRegionIds = agency?.regions?.map((r) => r.id).sort() || [];
        const selectedRegionIds = selectedRegions.map((r) => r.id).sort();
        const regionsChanged =
          currentRegionIds.length !== selectedRegionIds.length ||
          !currentRegionIds.every((id, i) => id === selectedRegionIds[i]);

        if (regionsChanged) {
          requestBody.region_ids = selectedRegions.map((r) => r.id);
        }
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to save agency');
      }

      const agencyId = isEditMode ? agency.id : result.data?.id;

      // Handle logo upload if there's a pending file
      if (pendingLogoFile && agencyId) {
        const uploadSuccess = await uploadLogo(agencyId);
        if (!uploadSuccess) {
          // Logo upload failed but agency was saved - close modal and notify
          onClose();
          toast.warning('Agency Saved', {
            description: `${data.name} was saved, but logo upload failed. You can try again.`,
          });
          onSuccess?.();
          return;
        }
      }

      // Handle logo removal if marked for removal
      if (logoRemoved && isEditMode && agency.id) {
        const removeSuccess = await removeLogo(agency.id);
        if (!removeSuccess) {
          // Logo removal failed but agency was saved - close modal and notify
          onClose();
          toast.warning('Agency Saved', {
            description: `${data.name} was saved, but logo removal failed. You can try again.`,
          });
          onSuccess?.();
          return;
        }
      }

      toast.success(isEditMode ? 'Agency Updated' : 'Agency Created', {
        description: isEditMode
          ? `${data.name} has been updated successfully.`
          : `${data.name} has been created successfully.`,
      });

      form.reset();
      setSelectedTrades([]);
      setSelectedRegions([]);
      setPendingLogoFile(null);
      setLogoRemoved(false);
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
    setSelectedTrades(agency?.trades || []);
    setSelectedRegions(agency?.regions || []);
    setPendingLogoFile(null);
    setLogoRemoved(false);
    setLogoUploadError(null);
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

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'details' | 'compliance')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" data-testid="details-tab">
              Details
            </TabsTrigger>
            <TabsTrigger
              value="compliance"
              data-testid="compliance-tab"
              disabled={!isEditMode}
            >
              Compliance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
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

                {/* Agency Logo */}
                <div
                  className="pt-4 border-t"
                  data-testid="logo-upload-section"
                >
                  <LogoUpload
                    currentLogoUrl={logoRemoved ? null : agency?.logo_url}
                    onFileSelect={handleLogoFileSelect}
                    isUploading={isUploadingLogo}
                    disabled={isSubmitting}
                    error={logoUploadError}
                  />
                </div>

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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="founded-year-select">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[200px]">
                            {foundedYearOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="employee-count-select">
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EMPLOYEE_COUNT_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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

                  <FormField
                    control={form.control}
                    name="verified"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Verified Agency</FormLabel>
                          <FormDescription>
                            Show orange verification badge on homepage
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="verified-switch"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Trade Specializations - Admin has no limit */}
                <div
                  className="pt-4 border-t"
                  data-testid="trade-selector-section"
                >
                  <TradeSelector
                    selectedTrades={selectedTrades}
                    onChange={setSelectedTrades}
                    disabled={isSubmitting}
                    maxTrades={100}
                  />
                </div>

                {/* Service Regions */}
                <div
                  className="pt-4 border-t"
                  data-testid="region-selector-section"
                >
                  <RegionSelector
                    selectedRegions={selectedRegions}
                    onChange={setSelectedRegions}
                    disabled={isSubmitting}
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
                    disabled={
                      isSubmitting ||
                      Object.keys(form.formState.errors).length > 0 ||
                      (!isEditMode && !form.formState.isValid) ||
                      (isEditMode && !form.formState.isDirty && !hasExternalChanges)
                    }
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
          </TabsContent>

          <TabsContent value="compliance" className="mt-6">
            {isEditMode && (
              <ComplianceSettings
                initialData={complianceData}
                onSave={saveComplianceData}
                isLoading={isLoadingCompliance}
                isAdmin={true}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
