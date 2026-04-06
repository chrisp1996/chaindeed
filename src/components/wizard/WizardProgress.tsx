'use client';

import { Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface WizardStep { id: number; name: string; description?: string; }
interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
  estimatedMinutesRemaining?: number;
}

export function WizardProgress({ steps, currentStep, estimatedMinutesRemaining }: WizardProgressProps) {
  const progressPercent = Math.round(((currentStep - 1) / Math.max(steps.length - 1, 1)) * 100);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">
          Step {currentStep} of {steps.length}: <span className="text-primary">{steps[currentStep - 1]?.name}</span>
        </span>
        {estimatedMinutesRemaining !== undefined && (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />~{estimatedMinutesRemaining} min left
          </span>
        )}
      </div>

      <Progress value={progressPercent} className="h-2" />

      {/* Step pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={step.id} className="flex flex-shrink-0 items-center">
              {index > 0 && (
                <div className={cn('h-[2px] w-4 flex-shrink-0', isCompleted || isCurrent ? 'bg-primary' : 'bg-muted')} />
              )}
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-primary text-white ring-2 ring-primary/30 ring-offset-1',
                  !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                )}>
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : <span>{stepNum}</span>}
                </div>
                <span className={cn(
                  'hidden whitespace-nowrap text-xs sm:block',
                  isCompleted && 'text-green-600',
                  isCurrent && 'font-semibold text-foreground',
                  !isCompleted && !isCurrent && 'text-muted-foreground'
                )}>
                  {step.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
