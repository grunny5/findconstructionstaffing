import { Calendar, Users, Briefcase, Star, Award, Clock } from 'lucide-react';

/**
 * Stat item for the stats display
 */
export interface StatItem {
  /** The numeric or text value to display prominently */
  value: string | number;
  /** The label describing the stat */
  label: string;
  /** Optional icon to display with the stat */
  icon?: 'calendar' | 'users' | 'briefcase' | 'star' | 'award' | 'clock';
}

export interface ProfileStatsProps {
  /** Array of stats to display */
  stats: StatItem[];
  /** Show optional barcode decoration */
  showBarcode?: boolean;
  /** Custom barcode text (defaults to stat values joined) */
  barcodeText?: string;
  /** Layout variant */
  variant?: 'default' | 'compact';
}

const statIcons = {
  calendar: Calendar,
  users: Users,
  briefcase: Briefcase,
  star: Star,
  award: Award,
  clock: Clock,
};

/**
 * ProfileStats Component
 *
 * Industrial Design System stats display with:
 * - Large numbers in Bebas Neue (font-display) or bold Barlow
 * - Labels in small uppercase Barlow
 * - Responsive grid: 3-4 on desktop, 2 on tablet, 1 on mobile
 * - Optional barcode decoration using Libre Barcode font
 */
export function ProfileStats({
  stats,
  showBarcode = false,
  barcodeText,
  variant = 'default',
}: ProfileStatsProps) {
  // Generate barcode text from stat values if not provided
  const displayBarcodeText =
    barcodeText ||
    stats
      .map((s) => s.value)
      .join('')
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase()
      .slice(0, 12) ||
    'INDUSTRIAL';

  const isCompact = variant === 'compact';

  return (
    <div className="relative" data-testid="profile-stats">
      {/* Stats Grid */}
      <div
        className={`grid gap-4 lg:gap-6 ${
          isCompact
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}
        data-testid="stats-grid"
      >
        {stats.map((stat, index) => {
          const IconComponent = stat.icon ? statIcons[stat.icon] : undefined;
          return (
            <div
              key={index}
              className={`bg-industrial-bg-card border border-industrial-graphite-200 rounded-industrial-sharp ${
                isCompact ? 'p-3 lg:p-4' : 'p-4 lg:p-6'
              }`}
              data-testid={`stat-item-${index}`}
            >
              {/* Icon and Label Row */}
              <div className="flex items-center gap-2 mb-2">
                {IconComponent && (
                  <IconComponent
                    className={`text-industrial-graphite-400 flex-shrink-0 ${
                      isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'
                    }`}
                    data-testid={`stat-icon-${index}`}
                  />
                )}
                <span
                  className={`font-body uppercase tracking-wide text-industrial-graphite-400 font-semibold truncate ${
                    isCompact ? 'text-xs' : 'text-xs lg:text-sm'
                  }`}
                  data-testid={`stat-label-${index}`}
                >
                  {stat.label}
                </span>
              </div>

              {/* Value */}
              <p
                className={`font-display text-industrial-graphite-600 leading-none ${
                  isCompact ? 'text-2xl' : 'text-2xl lg:text-3xl'
                }`}
                data-testid={`stat-value-${index}`}
              >
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Optional Barcode Decoration */}
      {showBarcode && (
        <div
          className="mt-4 flex justify-end"
          data-testid="barcode-container"
          aria-hidden="true"
        >
          <span
            className="font-barcode text-2xl text-industrial-graphite-300 select-none"
            data-testid="barcode-text"
          >
            *{displayBarcodeText}*
          </span>
        </div>
      )}
    </div>
  );
}

export default ProfileStats;
