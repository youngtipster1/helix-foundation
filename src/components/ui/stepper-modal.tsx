import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Stepper, type StepItem } from "@/components/ui/stepper";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  canProceed?: boolean;
  canSubmit?: boolean;
  submitLabel?: string;
  submitIcon?: LucideIcon;
  cancelLabel?: string;
  nextLabel?: string;
  backLabel?: string;
  className?: string;
  bodyClassName?: string;
  headerContent?: React.ReactNode;
  footerLeadingContent?: React.ReactNode;
  allowStepClick?: boolean;
  children: React.ReactNode;
}

export function StepperModal({
  open,
  onOpenChange,
  title,
  description,
  steps,
  currentStep,
  onStepClick,
  onBack,
  onNext,
  onSubmit,
  isSubmitting = false,
  canProceed = true,
  canSubmit = true,
  submitLabel = "Submit",
  submitIcon: SubmitIcon = Check,
  cancelLabel = "Cancel",
  nextLabel = "Continue",
  backLabel = "Back",
  className,
  bodyClassName,
  headerContent,
  footerLeadingContent,
  allowStepClick = true,
  children,
}: StepperModalProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        className={cn(
          "max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden",
          className
        )}
      >
        {/* Pinned Modal Header with Title & Stepper */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-card/50 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-foreground sm:text-lg">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </DialogDescription>
              )}
            </div>
            {headerContent}
          </div>

          <Stepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={onStepClick}
            allowStepClick={allowStepClick}
          />
        </DialogHeader>

        {/* Scrollable Modal Body */}
        <div
          className={cn(
            "flex-1 overflow-y-auto p-4 sm:p-6 space-y-4",
            bodyClassName
          )}
        >
          {children}
        </div>

        {/* Pinned Modal Footer with Navigation */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-t border-border bg-card/60 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            {footerLeadingContent}
          </div>

          <div className="flex items-center gap-2">
            {!isFirstStep && onBack && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBack}
                disabled={isSubmitting}
                className="text-xs gap-1"
              >
                <ChevronLeft className="size-3.5" />
                <span>{backLabel}</span>
              </Button>
            )}

            {!isLastStep ? (
              <Button
                type="button"
                size="sm"
                onClick={onNext}
                disabled={!canProceed || isSubmitting}
                className="text-xs gap-1"
              >
                <span>{nextLabel}</span>
                <ChevronRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={onSubmit}
                disabled={!canSubmit || isSubmitting}
                className="text-xs gap-1.5"
              >
                <SubmitIcon className="size-3.5" />
                <span>{isSubmitting ? "Processing..." : submitLabel}</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
