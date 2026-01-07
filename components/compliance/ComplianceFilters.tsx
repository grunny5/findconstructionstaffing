'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  FlaskConical,
  UserCheck,
  HeartHandshake,
  Shield,
  BadgeCheck,
} from 'lucide-react';
import {
  COMPLIANCE_DISPLAY_NAMES,
  COMPLIANCE_DESCRIPTIONS,
  COMPLIANCE_TYPES,
  type ComplianceType,
} from '@/types/api';
import { cn } from '@/lib/utils';

const COMPLIANCE_ICONS: Record<ComplianceType, React.ElementType> = {
  osha_certified: ShieldCheck,
  drug_testing: FlaskConical,
  background_checks: UserCheck,
  workers_comp: HeartHandshake,
  general_liability: Shield,
  bonding: BadgeCheck,
};

export interface ComplianceFiltersProps {
  selectedFilters: ComplianceType[];
  onChange: (filters: ComplianceType[]) => void;
  className?: string;
}

export function ComplianceFilters({
  selectedFilters,
  onChange,
  className,
}: ComplianceFiltersProps) {
  const handleToggle = (complianceType: ComplianceType) => {
    const isSelected = selectedFilters.includes(complianceType);
    const updated = isSelected
      ? selectedFilters.filter((t) => t !== complianceType)
      : [...selectedFilters, complianceType];
    onChange(updated);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-wide text-industrial-graphite-600">
          Compliance Requirements
        </h3>
        {selectedFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-6 px-2 font-body text-xs text-industrial-graphite-400 hover:text-industrial-graphite-600"
          >
            Clear all
          </Button>
        )}
      </div>

      {selectedFilters.length > 0 && (
        <Badge
          variant="secondary"
          className="bg-industrial-orange text-white rounded-industrial-sharp text-xs font-body font-semibold"
        >
          {selectedFilters.length} selected
        </Badge>
      )}

      <div className="space-y-3">
        {COMPLIANCE_TYPES.map((complianceType) => {
          const Icon = COMPLIANCE_ICONS[complianceType];
          const isChecked = selectedFilters.includes(complianceType);

          return (
            <div
              key={complianceType}
              className="flex items-start gap-3 p-3 rounded-industrial-base border border-industrial-graphite-200 hover:border-industrial-graphite-300 transition-colors"
            >
              <Checkbox
                id={`compliance-${complianceType}`}
                checked={isChecked}
                onCheckedChange={() => handleToggle(complianceType)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`compliance-${complianceType}`}
                  className="flex items-center gap-2 font-body text-sm font-semibold text-industrial-graphite-600 cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-industrial-graphite-400 flex-shrink-0" />
                  <span>{COMPLIANCE_DISPLAY_NAMES[complianceType]}</span>
                </Label>
                <p className="font-body text-xs text-industrial-graphite-400 mt-1">
                  {COMPLIANCE_DESCRIPTIONS[complianceType]}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedFilters.length > 0 && (
        <p className="font-body text-xs text-industrial-graphite-400 italic">
          Showing agencies with all selected compliance certifications
        </p>
      )}
    </div>
  );
}
