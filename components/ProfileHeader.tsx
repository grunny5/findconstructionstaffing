import Image from 'next/image';
import {
  Building2,
  MapPin,
  Calendar,
  Users,
  Briefcase,
  Star,
} from 'lucide-react';

/**
 * Category types for industrial color accent bands
 * - welding: Orange accent (--industrial-orange)
 * - electrical: Navy accent (--industrial-navy)
 * - mechanical: Graphite accent (--industrial-graphite)
 * - general: Light graphite accent (--industrial-graphite-300)
 */
export type ProfileCategory =
  | 'welding'
  | 'electrical'
  | 'mechanical'
  | 'general';

/**
 * Stat item for the stats row
 */
export interface ProfileStat {
  label: string;
  value: string | number;
  icon?: 'calendar' | 'users' | 'briefcase' | 'star';
}

export interface ProfileHeaderProps {
  /** Firm/Agency name - displayed in large Bebas Neue */
  firmName: string;
  /** Location text - displayed in smaller Barlow */
  location?: string;
  /** Array of stats to display */
  stats?: ProfileStat[];
  /** Category for optional accent band color */
  category?: ProfileCategory;
  /** Show the 6px gradient accent band (use sparingly) */
  showAccentBand?: boolean;
  /** Optional logo URL */
  logoUrl?: string;
  /** Optional description text */
  description?: string;
}

const statIcons = {
  calendar: Calendar,
  users: Users,
  briefcase: Briefcase,
  star: Star,
};

/**
 * Get the gradient class for category accent band
 */
function getCategoryGradient(category: ProfileCategory): string {
  switch (category) {
    case 'welding':
      return 'bg-gradient-to-r from-industrial-orange-400 to-industrial-orange-500';
    case 'electrical':
      return 'bg-gradient-to-r from-industrial-navy-400 to-industrial-navy-500';
    case 'mechanical':
      return 'bg-gradient-to-r from-industrial-graphite-500 to-industrial-graphite-600';
    default:
      return 'bg-industrial-graphite-300';
  }
}

/**
 * ProfileHeader Component
 *
 * Industrial Design System profile header with:
 * - Large Bebas Neue firm name (clamp(2rem, 5vw, 3rem), uppercase)
 * - Location/metadata in Barlow (0.875rem, graphite-400)
 * - Stats row with icons
 * - Optional 6px gradient accent band
 * - Responsive layout (stacks on mobile)
 */
export function ProfileHeader({
  firmName,
  location,
  stats,
  category = 'general',
  showAccentBand = false,
  logoUrl,
  description,
}: ProfileHeaderProps) {
  return (
    <div
      className="bg-industrial-bg-card border-b border-industrial-graphite-200"
      data-testid="profile-header"
    >
      {/* Optional category accent band */}
      {showAccentBand && (
        <div
          className={`h-1.5 ${getCategoryGradient(category)}`}
          data-testid="accent-band"
          aria-hidden="true"
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Logo */}
          <div className="flex-shrink-0" data-testid="logo-container">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${firmName} logo`}
                width={128}
                height={128}
                className="w-24 h-24 lg:w-32 lg:h-32 rounded-industrial-sharp object-cover border-2 border-industrial-graphite-200"
                data-testid="logo-image"
              />
            ) : (
              <div
                className="w-24 h-24 lg:w-32 lg:h-32 bg-industrial-graphite-100 rounded-industrial-sharp flex items-center justify-center border-2 border-industrial-graphite-200"
                data-testid="logo-placeholder"
              >
                <Building2 className="h-10 w-10 lg:h-12 lg:w-12 text-industrial-graphite-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Firm Name - Industrial Typography: clamp(2rem, 5vw, 3rem), uppercase */}
            <h1
              className="font-display text-industrial-graphite-600 uppercase tracking-wide leading-tight"
              style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
              data-testid="firm-name"
            >
              {firmName}
            </h1>

            {/* Location - Barlow, 0.875rem, graphite-400 */}
            {location && (
              <div
                className="flex items-center gap-2 mt-2"
                data-testid="location"
              >
                <MapPin className="h-4 w-4 text-industrial-graphite-400 flex-shrink-0" />
                <span className="font-body text-sm text-industrial-graphite-400">
                  {location}
                </span>
              </div>
            )}

            {/* Description */}
            {description && (
              <p
                className="font-body text-industrial-graphite-500 text-base lg:text-lg mt-3 max-w-3xl"
                data-testid="description"
              >
                {description}
              </p>
            )}

            {/* Stats Row */}
            {stats && stats.length > 0 && (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 mt-6 pt-6 border-t border-industrial-graphite-200"
                data-testid="stats-row"
              >
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon
                    ? statIcons[stat.icon]
                    : undefined;
                  return (
                    <div key={index} data-testid={`stat-${index}`}>
                      <div className="flex items-center gap-2 text-industrial-graphite-400 mb-1">
                        {IconComponent && (
                          <IconComponent className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="font-body text-xs sm:text-sm uppercase tracking-wide truncate">
                          {stat.label}
                        </span>
                      </div>
                      <p className="font-display text-2xl lg:text-3xl text-industrial-graphite-600">
                        {stat.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;
