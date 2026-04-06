'use client';

import { HelpCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FieldWithHelpProps {
  label: string;
  helpText: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  example?: string;
}

export function FieldWithHelp({ label, helpText, required, htmlFor, className, children, error, hint, example }: FieldWithHelpProps) {
  return (
    <TooltipProvider>
      <div className={cn('space-y-1.5', className)}>
        <div className="flex items-center gap-1.5">
          <Label htmlFor={htmlFor} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
            {label}
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                <HelpCircle className="h-3.5 w-3.5" />
                <span className="sr-only">Help for {label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs leading-relaxed">{helpText}</TooltipContent>
          </Tooltip>
        </div>
        {children}
        {example && !error && <p className="text-xs text-muted-foreground"><span className="font-medium">Example:</span> {example}</p>}
        {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
        {error && <p className="text-xs text-destructive flex items-start gap-1"><span>⚠</span> {error}</p>}
      </div>
    </TooltipProvider>
  );
}
