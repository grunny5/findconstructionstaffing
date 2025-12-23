'use client';

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
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
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
  }, [percentage]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Completion</CardTitle>
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
                className="text-muted"
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
                <div className="text-3xl font-bold">{percentage}%</div>
                <div className="text-xs text-muted-foreground">
                  {getCompletionStatus()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Linear Progress Bar (Alternative) */}
        <div className="space-y-2">
          <Progress value={percentage} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">
            {percentage === 100
              ? 'Your profile is complete!'
              : `${100 - percentage}% to go`}
          </p>
        </div>

        {/* Completion Checklist */}
        {checklistItems.length > 0 && (
          <div className="pt-2 border-t">
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
          <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Profile Complete
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
