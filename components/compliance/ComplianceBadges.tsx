'use client';

import { CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  COMPLIANCE_DISPLAY_NAMES,
  COMPLIANCE_DESCRIPTIONS,
  type ComplianceType,
  type ComplianceItem,
} from '@/types/api';
import { cn } from '@/lib/utils';
import {
  COMPLIANCE_ICONS,
  DEFAULT_COMPLIANCE_ICON,
} from '@/lib/constants/compliance';

export interface ComplianceBadgesProps {
  compliance: ComplianceItem[];
  variant?: 'default' | 'compact';
}

export function ComplianceBadges({
  compliance,
  variant = 'default',
}: ComplianceBadgesProps) {
  // Return null if no compliance items
  if (!compliance || compliance.length === 0) {
    return null;
  }

  const formatExpirationDate = (dateString: string | null): string | null => {
    if (!dateString) return null;

    // Parse date-only strings as UTC to avoid timezone shifts
    let date: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Date-only ISO string - parse as UTC
      date = new Date(dateString + 'T00:00:00Z');
    } else {
      date = new Date(dateString);
    }

    const month = date.toLocaleDateString('en-US', {
      month: 'short',
      timeZone: 'UTC',
    });
    const year = date.getUTCFullYear();
    return `${month} ${year}`;
  };

  if (variant === 'compact') {
    // Compact variant for agency cards
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {compliance.slice(0, 3).map((item) => {
          const Icon = COMPLIANCE_ICONS[item.type] || DEFAULT_COMPLIANCE_ICON;
          return (
            <TooltipProvider key={item.type}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'p-1.5 rounded-industrial-sharp',
                      item.isVerified
                        ? 'bg-green-50 text-green-600'
                        : 'bg-industrial-graphite-100 text-industrial-graphite-500'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-semibold">
                    {COMPLIANCE_DISPLAY_NAMES[item.type]}
                  </p>
                  {item.isVerified && (
                    <p className="text-xs text-green-600">Verified</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
        {compliance.length > 3 && (
          <span className="text-xs font-medium text-industrial-graphite-400">
            +{compliance.length - 3}
          </span>
        )}
      </div>
    );
  }

  // Default variant for profile pages
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {compliance.map((item) => {
        const Icon = COMPLIANCE_ICONS[item.type] || DEFAULT_COMPLIANCE_ICON;
        const formattedExpiration = formatExpirationDate(item.expirationDate);

        return (
          <TooltipProvider key={item.type}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-industrial-base border-2 transition-colors',
                    item.isExpired
                      ? 'border-industrial-orange-400 bg-industrial-orange-50'
                      : item.isVerified
                        ? 'border-green-200 bg-green-50'
                        : 'border-industrial-graphite-200 bg-industrial-bg-card',
                    'hover:border-industrial-orange cursor-help'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-industrial-sharp',
                      item.isExpired
                        ? 'bg-industrial-orange-100 text-industrial-orange-600'
                        : item.isVerified
                          ? 'bg-green-100 text-green-600'
                          : 'bg-industrial-graphite-100 text-industrial-graphite-500'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-body text-sm font-semibold text-industrial-graphite-600 leading-tight">
                        {COMPLIANCE_DISPLAY_NAMES[item.type]}
                      </h4>

                      {item.isVerified && !item.isExpired && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}

                      {item.isExpired && (
                        <AlertCircle className="h-4 w-4 text-industrial-orange-600 flex-shrink-0" />
                      )}
                    </div>

                    {formattedExpiration && (
                      <p
                        className={cn(
                          'font-body text-xs mt-1',
                          item.isExpired
                            ? 'text-industrial-orange-600 font-semibold'
                            : 'text-industrial-graphite-400'
                        )}
                      >
                        {item.isExpired ? 'Expired' : 'Expires'}{' '}
                        {formattedExpiration}
                      </p>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs font-body"
                align="start"
              >
                <div className="space-y-1.5">
                  <p className="font-semibold text-sm">
                    {COMPLIANCE_DISPLAY_NAMES[item.type]}
                  </p>
                  <p className="text-xs text-industrial-graphite-400">
                    {COMPLIANCE_DESCRIPTIONS[item.type]}
                  </p>
                  {item.isVerified && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-50 text-green-600 border-green-200"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {item.isExpired && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-industrial-orange-50 text-industrial-orange-600 border-industrial-orange-200"
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Expired {formattedExpiration}
                    </Badge>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
