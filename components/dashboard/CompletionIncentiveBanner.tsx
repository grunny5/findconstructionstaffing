'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Zap, Star, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

interface CompletionIncentiveBannerProps {
  percentage: number;
  incompleteSection?: string; // e.g., '/dashboard/profile#logo'
}

type BannerState = {
  variant: 'destructive' | 'warning' | 'info' | 'success';
  icon: typeof TrendingUp;
  title: string;
  message: string;
  ctaText: string;
  isDismissible: boolean;
};

const STORAGE_KEY_PREFIX = 'completion-banner-dismissed';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function CompletionIncentiveBanner({
  percentage,
  incompleteSection = '/dashboard/profile',
}: CompletionIncentiveBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showCompactBadge, setShowCompactBadge] = useState(false);

  // Determine banner state based on completion percentage
  const getBannerState = (): BannerState | null => {
    if (percentage < 50) {
      return {
        variant: 'destructive',
        icon: TrendingUp,
        title: 'Boost Your Visibility',
        message: 'Complete your profile to get 3x more leads',
        ctaText: 'Complete Profile',
        isDismissible: true,
      };
    } else if (percentage >= 50 && percentage < 80) {
      return {
        variant: 'warning',
        icon: Zap,
        title: 'Almost There!',
        message: 'Complete your profile for premium placement',
        ctaText: 'Finish Profile',
        isDismissible: true,
      };
    } else if (percentage >= 80 && percentage < 100) {
      return {
        variant: 'info',
        icon: Star,
        title: 'One More Step',
        message: 'Just one more step to unlock Featured Agency status',
        ctaText: 'Complete Now',
        isDismissible: true,
      };
    } else if (percentage === 100) {
      return {
        variant: 'success',
        icon: CheckCircle2,
        title: 'Congratulations!',
        message: 'Your profile is complete',
        ctaText: 'View Profile',
        isDismissible: true,
      };
    }
    return null;
  };

  const bannerState = getBannerState();

  // Check localStorage for dismissal state
  useEffect(() => {
    if (!bannerState) return;

    const storageKey = `${STORAGE_KEY_PREFIX}-${percentage}`;
    const dismissedData = localStorage.getItem(storageKey);

    if (dismissedData) {
      const { timestamp } = JSON.parse(dismissedData);
      const now = Date.now();

      // For 100% banner, check if 1 week has passed
      if (percentage === 100) {
        if (now - timestamp < ONE_WEEK_MS) {
          setIsDismissed(true);
          setShowCompactBadge(true);
        } else {
          // Week has passed, clear storage and show full banner
          localStorage.removeItem(storageKey);
        }
      } else {
        // For other banners, keep dismissed state for session
        setIsDismissed(true);
      }
    }
  }, [percentage, bannerState]);

  // Trigger confetti for 100% completion
  useEffect(() => {
    if (percentage === 100 && !isDismissed) {
      const duration = 3000;
      const end = Date.now() + duration;
      let frameId: number;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#22c55e', '#16a34a', '#15803d'],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#22c55e', '#16a34a', '#15803d'],
        });

        if (Date.now() < end) {
          frameId = requestAnimationFrame(frame);
        }
      };

      frameId = requestAnimationFrame(frame);

      return () => {
        if (frameId) {
          cancelAnimationFrame(frameId);
        }
      };
    }
  }, [percentage, isDismissed]);

  const handleDismiss = () => {
    if (!bannerState) return;

    const storageKey = `${STORAGE_KEY_PREFIX}-${percentage}`;
    localStorage.setItem(storageKey, JSON.stringify({ timestamp: Date.now() }));
    setIsDismissed(true);

    if (percentage === 100) {
      setShowCompactBadge(true);
    }
  };

  // Don't render anything if no banner state or dismissed (except 100% compact badge)
  if (!bannerState || (isDismissed && !showCompactBadge)) {
    return null;
  }

  // Show compact badge for 100% completion after dismissal
  if (showCompactBadge && percentage === 100) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-green-700">
          Profile Complete
        </span>
      </div>
    );
  }

  const Icon = bannerState.icon;

  return (
    <Alert variant={bannerState.variant} className="relative">
      <Icon className="h-4 w-4" />
      <AlertTitle>{bannerState.title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{bannerState.message}</span>
        <div className="flex items-center gap-2">
          <Link href={incompleteSection}>
            <Button size="sm" variant="default">
              {bannerState.ctaText}
            </Button>
          </Link>
          {bannerState.isDismissible && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
