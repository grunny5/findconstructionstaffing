'use client';

/**
 * ProfileCompletionWidget Component - Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 6.2 - Update Dashboard Pages
 */

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { CompletionChecklist, type ChecklistItem } from './CompletionChecklist';

interface ProfileCompletionWidgetProps {
  percentage: number;
  checklistItems?: ChecklistItem[];
  /** @deprecated Use checklistItems instead */
  missingFields?: string[];
}

export function ProfileCompletionWidget({
  percentage,
  checklistItems = [],
  missingFields = [],
}: ProfileCompletionWidgetProps) {
  const getCompletionStatus = () => {
    if (percentage === 100) return 'Complete';
    if (percentage >= 80) return 'Almost There';
    if (percentage >= 50) return 'Good Progress';
    return 'Getting Started';
  };

  const getCompletionColor = () => {
    if (percentage === 100) return 'text-green-600';
    if (percentage >= 80) return 'text-industrial-navy-400';
    if (percentage >= 50) return 'text-industrial-orange';
    return 'text-industrial-orange-600';
  };

  // Celebrate with confetti when profile reaches 100%
  useEffect(() => {
    if (percentage === 100) {
      const duration = 3000;
      const end = Date.now() + duration;
      let frameId: number;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#E07B00', '#FF9F1C', '#B85C00'], // Industrial orange palette
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#E07B00', '#FF9F1C', '#B85C00'],
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
  }, [percentage]);

  return (
    <Card className="border-2 border-industrial-graphite-200 rounded-industrial-sharp bg-industrial-bg-card">
      <CardHeader>
        <CardTitle className="font-display text-xl uppercase tracking-wide text-industrial-graphite-600">
          Profile Completion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Circular Progress Display */}
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            {/* Background Circle */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-industrial-graphite-200"
              />
              {/* Progress Circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
                className={`transition-all duration-500 ${getCompletionColor()}`}
                strokeLinecap="round"
              />
            </svg>
            {/* Percentage Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="font-display text-3xl text-industrial-graphite-600">
                  {percentage}%
                </div>
                <div className="font-body text-xs text-industrial-graphite-400">
                  {getCompletionStatus()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Linear Progress Bar (Alternative) */}
        <div className="space-y-2">
          <Progress value={percentage} className="h-2" />
          <p className="font-body text-sm text-center text-industrial-graphite-400">
            {percentage === 100
              ? 'Your profile is complete!'
              : `${100 - percentage}% to go`}
          </p>
        </div>

        {/* Completion Checklist */}
        {checklistItems.length > 0 && (
          <div className="pt-2 border-t-2 border-industrial-graphite-200">
            <CompletionChecklist items={checklistItems} />
          </div>
        )}

        {/* CTA Button for < 80% completion */}
        {percentage < 80 && checklistItems.length > 0 && (
          <Link href="/dashboard/profile" className="block">
            <Button className="w-full" variant="default">
              Complete Your Profile
            </Button>
          </Link>
        )}

        {/* Completion Badge */}
        {percentage === 100 && (
          <div className="flex items-center justify-center gap-2 p-3 bg-industrial-orange-100 rounded-industrial-sharp border-2 border-industrial-orange">
            <CheckCircle2 className="h-5 w-5 text-industrial-orange" />
            <span className="font-body text-sm font-semibold text-industrial-orange-600">
              Profile Complete
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
