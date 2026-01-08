/**
 * Shared compliance UI constants
 *
 * This file provides shared icon mappings and UI-related constants
 * for compliance features across the application.
 */

import {
  ShieldCheck,
  FlaskConical,
  UserCheck,
  HeartHandshake,
  Shield,
  BadgeCheck,
} from 'lucide-react';
import type { ComplianceType } from '@/types/api';

/**
 * Icon mapping for each compliance type
 * Used across ComplianceBadges, ComplianceFilters, and ComplianceSettings
 */
export const COMPLIANCE_ICONS: Record<ComplianceType, React.ElementType> = {
  osha_certified: ShieldCheck,
  drug_testing: FlaskConical,
  background_checks: UserCheck,
  workers_comp: HeartHandshake,
  general_liability: Shield,
  bonding: BadgeCheck,
};
