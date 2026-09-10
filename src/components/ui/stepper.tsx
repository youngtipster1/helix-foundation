import * as React from "react";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number; // 0-indexed
  onStepClick?: (stepIndex: number) => void;
  className?: string;
  allowStepClick?: boolean; // Whether users can jump to completed steps
}

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  className,
  allowStepClick = true,
}: StepperProps) {
  const currentStepData = steps[currentStep] || steps[0];

  return (
    <div className={cn("w-full space-y-2.5", className)}>
      {/* Mobile Compact Progress Bar (< md) */}
      <div className="block md:hidden space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">
            Step {currentStep + 1} of {steps.length}:{" "}
            <span className="text-primary font-bold">{currentStepData.title}</span>
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </span>
        </div>

        {/* Segmented Progress Bar */}
        <div className="flex items-center gap-1.5">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={step.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  isCompleted && "bg-primary",
                  isCurrent && "bg-primary ring-2 ring-primary/20",
                  idx > currentStep && "bg-muted",
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Desktop Horizontal Step Indicator (md+) */}
      <div className="hidden md:flex items-center justify-between w-full">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isUpcoming = idx > currentStep;
          const StepIcon = step.icon;

          const isClickable = allowStepClick && (isCompleted || isCurrent);

          return (
            <React.Fragment key={step.id}>
              {/* Step Node */}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(idx)}
                className={cn(
                  "group flex items-center gap-3 text-left transition-all",
                  isClickable ? "cursor-pointer" : "cursor-default",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Circle Badge */}
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-200",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground shadow-xs",
                    isCurrent &&
                      "border-primary bg-primary/10 text-primary ring-4 ring-primary/15 font-extrabold",
                    isUpcoming &&
                      "border-border bg-muted/40 text-muted-foreground opacity-70",
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4 stroke-[3]" />
                  ) : StepIcon ? (
                    <StepIcon className="size-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Step Text */}
                <div className="min-w-0">
                  <span
                    className={cn(
                      "block text-xs font-semibold tracking-tight transition-colors",
                      isCurrent && "text-primary font-bold",
                      isCompleted && "text-foreground",
                      isUpcoming && "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="block text-[10px] text-muted-foreground truncate max-w-[120px]">
                      {step.description}
                    </span>
                  )}
                </div>
              </button>

              {/* Connecting Line between steps */}
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-3 rounded-full transition-colors duration-300",
                    idx < currentStep ? "bg-primary" : "bg-border/80",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
