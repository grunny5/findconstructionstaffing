/**
 * StatsCard Component - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 6.2 - Update Dashboard Pages
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: StatsCardProps) {
  return (
    <Card className="border-2 border-industrial-graphite-200 rounded-industrial-sharp bg-industrial-bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-body text-xs uppercase font-semibold tracking-wide text-industrial-graphite-400">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-industrial-orange" />}
      </CardHeader>
      <CardContent>
        <div className="font-display text-3xl text-industrial-graphite-600">
          {value}
        </div>
        {description && (
          <p className="font-body text-xs text-industrial-graphite-400 mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className={`font-body text-xs font-semibold ${
                trend.isPositive
                  ? 'text-green-600'
                  : 'text-industrial-orange-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className="font-body text-xs text-industrial-graphite-400">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
