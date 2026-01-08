'use client';

/**
 * ComplianceDashboard Component
 * Feature: 013-industry-compliance-and-verification
 * Task: 2.1.2 - Create Compliance Dashboard Page
 *
 * Client component that wraps ComplianceSettings and handles API interactions.
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  ComplianceSettings,
  type ComplianceFormData,
} from './ComplianceSettings';
import {
  type AgencyComplianceRow,
  type ComplianceItemFull,
  toComplianceItemFull,
} from '@/types/api';
import { Loader2 } from 'lucide-react';

interface ComplianceDashboardProps {
  agencyId: string;
  initialData: AgencyComplianceRow[];
}

export function ComplianceDashboard({
  agencyId,
  initialData,
}: ComplianceDashboardProps) {
  const { toast } = useToast();
  const [complianceData, setComplianceData] = useState<ComplianceItemFull[]>(
    () => initialData.map(toComplianceItemFull)
  );
  const [isLoading, setIsLoading] = useState(false);

  // Transform initial data when it changes
  useEffect(() => {
    setComplianceData(initialData.map(toComplianceItemFull));
  }, [initialData]);

  const handleSave = async (data: ComplianceFormData[]): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/dashboard/compliance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: data.map((item) => ({
            type: item.type,
            isActive: item.isActive,
            expirationDate: item.expirationDate,
          })),
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save changes';
        try {
          const text = await response.text();
          if (text) {
            const errorData = JSON.parse(text);
            if (errorData?.error?.message) {
              errorMessage = errorData.error.message;
            }
          }
        } catch {
          // JSON parsing failed, use statusText or default
          if (response.statusText) {
            errorMessage = response.statusText;
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setComplianceData(result.data);

      toast({
        title: 'Changes saved',
        description: 'Your compliance settings have been updated.',
      });
    } catch (error) {
      console.error('Error saving compliance data:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!agencyId) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-industrial-graphite-400" />
      </div>
    );
  }

  return (
    <ComplianceSettings
      initialData={complianceData}
      onSave={handleSave}
      isLoading={isLoading}
      isAdmin={false}
    />
  );
}
