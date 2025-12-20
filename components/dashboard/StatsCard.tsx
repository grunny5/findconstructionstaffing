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

/**
 * Renders a statistics card with a title, main value, and optional icon, description, and trend.
 *
 * The optional `trend` displays a percentage prefixed with '+' when `trend.isPositive` is true and is colored green for positive trends or red for negative trends.
 *
 * @param title - The card title shown in the header
 * @param value - The primary statistic displayed prominently
 * @param description - Optional secondary text shown beneath the value
 * @param icon - Optional icon component rendered in the header
 * @param trend - Optional trend meta shown as a percentage and label; shape: `{ value: number, label: string, isPositive: boolean }`
 * @returns A React element representing the statistics card
 */
export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}