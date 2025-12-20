import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';

interface ProfileCompletionWidgetProps {
  percentage: number;
  missingFields?: string[];
}

/**
 * Render a profile completion widget with circular and linear progress indicators.
 *
 * Displays a centered circular progress visualization, a linear progress bar, a contextual
 * status label and message, an optional list of missing profile fields (shows up to three
 * with a "+N more" indicator), and a completion badge when the percentage is 100.
 *
 * @param percentage - Completion percentage from 0 to 100 that drives visuals and status text.
 * @param missingFields - Optional list of missing profile field names; defaults to an empty array.
 * @returns The rendered ProfileCompletionWidget element.
 */
export function ProfileCompletionWidget({
  percentage,
  missingFields = [],
}: ProfileCompletionWidgetProps) {
  const getCompletionStatus = () => {
    if (percentage === 100) return 'Complete';
    if (percentage >= 75) return 'Almost There';
    if (percentage >= 50) return 'Good Progress';
    return 'Getting Started';
  };

  const getCompletionColor = () => {
    if (percentage === 100) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-orange-600';
  };

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

        {/* Missing Fields */}
        {missingFields.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Complete your profile:</p>
            <ul className="space-y-1">
              {missingFields.slice(0, 3).map((field, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Circle className="h-3 w-3" />
                  <span>{field}</span>
                </li>
              ))}
              {missingFields.length > 3 && (
                <li className="text-sm text-muted-foreground pl-5">
                  +{missingFields.length - 3} more
                </li>
              )}
            </ul>
          </div>
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