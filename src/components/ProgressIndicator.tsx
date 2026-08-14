import React from 'react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  name: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="w-full max-w-3xl mx-auto mb-8 px-4 md:px-0">
      {/* Mobile view: Simple text counter */}
      <div className="flex md:hidden justify-between items-center text-xs text-muted-text mb-2">
        <span className="font-semibold text-foreground">
          Step {currentStep} of {steps.length}
        </span>
        <span>{steps[currentStep - 1]?.name}</span>
      </div>
      
      {/* Visual horizontal track */}
      <div className="h-1 w-full bg-border-color/50 rounded-full overflow-hidden flex gap-1 mb-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "h-full flex-1 transition-all duration-300 rounded-full",
              step.id <= currentStep ? "bg-accent" : "bg-border-color/60"
            )}
          />
        ))}
      </div>

      {/* Desktop view: Step names with alignment */}
      <div className="hidden md:flex justify-between text-[11px] font-medium tracking-wider text-muted-text uppercase">
        {steps.map((step) => (
          <span
            key={step.id}
            className={cn(
              "transition-colors duration-200",
              step.id === currentStep && "text-foreground font-semibold",
              step.id < currentStep && "text-foreground/70"
            )}
          >
            {step.name}
          </span>
        ))}
      </div>
    </div>
  );
}
