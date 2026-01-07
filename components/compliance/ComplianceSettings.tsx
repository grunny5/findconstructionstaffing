'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  ShieldCheck,
  FlaskConical,
  UserCheck,
  HeartHandshake,
  Shield,
  BadgeCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  COMPLIANCE_TYPES,
  COMPLIANCE_DISPLAY_NAMES,
  COMPLIANCE_DESCRIPTIONS,
  type ComplianceType,
  type ComplianceItemFull,
} from '@/types/api';
import { cn } from '@/lib/utils';
import { ComplianceDocumentUpload } from './ComplianceDocumentUpload';
import { useToast } from '@/hooks/use-toast';

const COMPLIANCE_ICONS: Record<ComplianceType, React.ElementType> = {
  osha_certified: ShieldCheck,
  drug_testing: FlaskConical,
  background_checks: UserCheck,
  workers_comp: HeartHandshake,
  general_liability: Shield,
  bonding: BadgeCheck,
};

export interface ComplianceFormData {
  type: ComplianceType;
  isActive: boolean;
  expirationDate: string | null;
}

export interface ComplianceSettingsProps {
  initialData?: ComplianceItemFull[];
  onSave: (data: ComplianceFormData[]) => Promise<void>;
  isLoading?: boolean;
  isAdmin?: boolean;
}

export function ComplianceSettings({
  initialData = [],
  onSave,
  isLoading = false,
  isAdmin = false,
}: ComplianceSettingsProps) {
  const [formData, setFormData] = useState<
    Record<ComplianceType, ComplianceFormData>
  >(() => {
    const initial: Record<ComplianceType, ComplianceFormData> = {} as Record<
      ComplianceType,
      ComplianceFormData
    >;

    for (const type of COMPLIANCE_TYPES) {
      const existing = initialData.find((item) => item.type === type);
      initial[type] = {
        type,
        isActive: existing?.isActive ?? false,
        expirationDate: existing?.expirationDate ?? null,
      };
    }

    return initial;
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<ComplianceType | null>(
    null
  );
  const [documentUrls, setDocumentUrls] = useState<
    Partial<Record<ComplianceType, string | null>>
  >(() => {
    const urls: Partial<Record<ComplianceType, string | null>> = {};
    for (const item of initialData) {
      if (item.documentUrl) {
        urls[item.type] = item.documentUrl;
      }
    }
    return urls;
  });
  const { toast } = useToast();

  useEffect(() => {
    const initial: Record<ComplianceType, ComplianceFormData> = {} as Record<
      ComplianceType,
      ComplianceFormData
    >;

    for (const type of COMPLIANCE_TYPES) {
      const existing = initialData.find((item) => item.type === type);
      initial[type] = {
        type,
        isActive: existing?.isActive ?? false,
        expirationDate: existing?.expirationDate ?? null,
      };
    }

    setFormData(initial);
    setIsDirty(false);

    const urls: Partial<Record<ComplianceType, string | null>> = {};
    for (const item of initialData) {
      if (item.documentUrl) {
        urls[item.type] = item.documentUrl;
      }
    }
    setDocumentUrls(urls);
  }, [initialData]);

  const handleToggle = (type: ComplianceType, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        isActive: checked,
        expirationDate: checked ? prev[type].expirationDate : null,
      },
    }));
    setIsDirty(true);
  };

  const handleDateChange = (type: ComplianceType, date: string) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        expirationDate: date || null,
      },
    }));
    setIsDirty(true);
  };

  const handleDocumentUpload = async (type: ComplianceType, file: File) => {
    setUploadingType(type);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('compliance_type', type);

      const response = await fetch('/api/dashboard/compliance/document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      setDocumentUrls((prev) => ({
        ...prev,
        [type]: data.data.document_url,
      }));

      toast({
        title: 'Document uploaded',
        description: 'Your compliance document has been uploaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description:
          error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploadingType(null);
    }
  };

  const handleDocumentRemove = async (type: ComplianceType) => {
    setUploadingType(type);

    try {
      const response = await fetch(
        `/api/dashboard/compliance/document?compliance_type=${type}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Delete failed');
      }

      setDocumentUrls((prev) => ({
        ...prev,
        [type]: null,
      }));

      toast({
        title: 'Document removed',
        description: 'Your compliance document has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description:
          error instanceof Error ? error.message : 'Failed to delete document',
        variant: 'destructive',
      });
    } finally {
      setUploadingType(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const data = Object.values(formData);
      await onSave(data);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  const getVerificationStatus = (
    type: ComplianceType
  ): 'verified' | 'unverified' | null => {
    const item = initialData.find((d) => d.type === type);
    if (!item?.isActive) return null;
    return item.isVerified ? 'verified' : 'unverified';
  };

  const isExpired = (type: ComplianceType): boolean => {
    const item = initialData.find((d) => d.type === type);
    return item?.isExpired ?? false;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="border-b border-industrial-graphite-200 pb-6">
        <h2 className="font-display text-2xl uppercase tracking-wide text-industrial-graphite-600">
          Compliance & Certifications
        </h2>
        <p className="font-body text-sm text-industrial-graphite-400 mt-2">
          Toggle the compliance certifications your agency maintains. Add
          expiration dates where applicable to receive renewal reminders.
        </p>
      </div>

      {/* Compliance Items */}
      <div className="space-y-6">
        {COMPLIANCE_TYPES.map((type) => {
          const Icon = COMPLIANCE_ICONS[type];
          const item = formData[type];
          const verificationStatus = getVerificationStatus(type);
          const expired = isExpired(type);

          return (
            <div
              key={type}
              className={cn(
                'bg-industrial-bg-card border-2 border-industrial-graphite-200 rounded-industrial-base p-5',
                'transition-all duration-200',
                item.isActive && 'border-l-4 border-l-industrial-orange',
                expired && item.isActive && 'border-l-industrial-orange-600'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Icon and Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={cn(
                      'p-2 rounded-industrial-sharp',
                      item.isActive
                        ? 'bg-industrial-orange-100 text-industrial-orange-600'
                        : 'bg-industrial-graphite-100 text-industrial-graphite-400'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Label
                        htmlFor={`compliance-${type}`}
                        className="font-body text-base font-semibold text-industrial-graphite-600 cursor-pointer"
                      >
                        {COMPLIANCE_DISPLAY_NAMES[type]}
                      </Label>

                      {verificationStatus === 'verified' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-industrial-sharp">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </span>
                      )}

                      {expired && item.isActive && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-industrial-orange-600 bg-industrial-orange-100 px-2 py-0.5 rounded-industrial-sharp">
                          <AlertCircle className="h-3 w-3" />
                          Expired
                        </span>
                      )}
                    </div>

                    <p className="font-body text-sm text-industrial-graphite-400 mt-1">
                      {COMPLIANCE_DESCRIPTIONS[type]}
                    </p>

                    {/* Expiration Date - Only show when active */}
                    {item.isActive && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <Label
                            htmlFor={`expiration-${type}`}
                            className="font-body text-xs font-semibold uppercase tracking-widest text-industrial-graphite-400 mb-2 block"
                          >
                            Expiration Date (optional)
                          </Label>
                          <Input
                            id={`expiration-${type}`}
                            type="date"
                            value={item.expirationDate ?? ''}
                            onChange={(e) =>
                              handleDateChange(type, e.target.value)
                            }
                            disabled={isLoading || isSaving}
                            className={cn(
                              'max-w-[200px] font-body',
                              'border-2 border-industrial-graphite-300 rounded-industrial-sharp',
                              'focus:border-industrial-orange focus:ring-1 focus:ring-industrial-orange',
                              expired && 'border-industrial-orange-400'
                            )}
                          />
                        </div>

                        {/* Document Upload */}
                        <div>
                          <ComplianceDocumentUpload
                            complianceType={type}
                            currentUrl={documentUrls[type]}
                            onUpload={(file) => handleDocumentUpload(type, file)}
                            onRemove={() => handleDocumentRemove(type)}
                            isUploading={uploadingType === type}
                            disabled={isLoading || isSaving}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Toggle Switch */}
                <div className="flex items-center gap-3 sm:ml-4">
                  <span
                    className={cn(
                      'font-body text-xs font-semibold uppercase tracking-wide',
                      item.isActive
                        ? 'text-industrial-orange'
                        : 'text-industrial-graphite-400'
                    )}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Switch
                    id={`compliance-${type}`}
                    checked={item.isActive}
                    onCheckedChange={(checked) => handleToggle(type, checked)}
                    disabled={isLoading || isSaving}
                    aria-label={`Toggle ${COMPLIANCE_DISPLAY_NAMES[type]}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Note */}
      {!isAdmin && (
        <div className="bg-industrial-graphite-100 border border-industrial-graphite-200 rounded-industrial-base p-4">
          <p className="font-body text-sm text-industrial-graphite-500">
            <strong>Note:</strong> Compliance items can be verified by our team
            after you upload supporting documentation. Verified items display a
            badge on your public profile.
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-6 border-t border-industrial-graphite-200">
        <Button
          type="submit"
          disabled={!isDirty || isLoading || isSaving}
          className={cn(
            'font-body text-sm font-semibold uppercase tracking-wide',
            'bg-industrial-orange text-white px-8 py-3 rounded-industrial-sharp',
            'hover:bg-industrial-orange-500 transition-colors duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
