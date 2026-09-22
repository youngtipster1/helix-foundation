import { useState, useEffect, useMemo } from "react";
import { StepperModal } from "@/components/ui/stepper-modal";
import { type StepItem } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { CalibrationStatusBadge } from "@/modules/tools/components/calibration-status-badge";
import { toolsService } from "@/modules/tools/services/tools-service";
import { toolsJobService } from "@/modules/tools/services/tools-job-service";
import { toolsSettingsService } from "@/modules/tools/services/tools-settings-service";
import { personnelService } from "@/modules/settings/services/personnel-service";
import type { Tool, JobType, ToolStatus, ToolJob } from "@/modules/tools/types";
import type { Personnel } from "@/modules/settings/types";
import { toast } from "sonner";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  UserCheck,
  ClipboardCheck,
} from "lucide-react";

interface CreateJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated?: (job: ToolJob) => void;
  preselectedTool?: Tool | null;
}

const STEPS: StepItem[] = [
  {
    id: "tool",
    title: "Equipment",
    description: "Select tool",
    icon: Wrench,
  },
  {
    id: "job",
    title: "Job Scope",
    description: "Type & assignee",
    icon: UserCheck,
  },
  {
    id: "review",
    title: "Review & Submit",
    description: "Contact & confirm",
    icon: ClipboardCheck,
  },
];

export function CreateJobModal({
  open,
  onOpenChange,
  onJobCreated,
  preselectedTool = null,
}: CreateJobModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Data sources
  const [toolsList, setToolsList] = useState<Tool[]>([]);
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(preselectedTool);

  // Form fields
  const [jobType, setJobType] = useState<JobType>("Calibration");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [issue, setIssue] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [toolStatus, setToolStatus] = useState<ToolStatus>("Good");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      async function loadData() {
        try {
          const [tools, personnel, types] = await Promise.all([
            toolsService.list(),
            personnelService.list(),
            toolsSettingsService.getJobTypes(),
          ]);
          setToolsList(tools);
          const activePersonnel = personnel.filter((p) => p.status === "active");
          setPersonnelList(activePersonnel);
          setJobTypes(types);

          if (activePersonnel.length > 0 && !assignedToId) {
            setAssignedToId(activePersonnel[0].id);
          }
        } catch (err) {
          console.error("Error loading create job modal data", err);
        }
      }
      loadData();
    }
  }, [open]);

  useEffect(() => {
    if (preselectedTool) {
      setSelectedTool(preselectedTool);
    }
  }, [preselectedTool]);

  useEffect(() => {
    if (selectedTool) {
      setContactName(selectedTool.vendorContact || "");
      setContactEmail(selectedTool.vendorEmail || "");
      setContactPhone(selectedTool.vendorPhone || "");
    }
  }, [selectedTool]);

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return toolsList;
    const q = searchQuery.toLowerCase();
    return toolsList.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.serialNumber.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.oem.toLowerCase().includes(q) ||
        t.model.toLowerCase().includes(q) ||
        t.vendor.toLowerCase().includes(q),
    );
  }, [toolsList, searchQuery]);

  // Calibration restriction rule:
  const isCalibrationRestricted =
    selectedTool !== null &&
    toolsJobService.jobTypeRequiresCalibration(jobType) &&
    selectedTool.calibrationStatus === "expired";

  const canProceedFromStep0 = Boolean(selectedTool);
  const canProceedFromStep1 = Boolean(
    selectedTool && !isCalibrationRestricted && issue.trim() && assignedToId,
  );

  const handleNext = () => {
    if (currentStep === 0) {
      if (!canProceedFromStep0) {
        toast.error("Please select an equipment tool to proceed.");
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (isCalibrationRestricted) {
        toast.error("Tool calibration is expired for this job type.");
        return;
      }
      if (!issue.trim()) {
        toast.error("Please enter the initial issue / scope of work.");
        return;
      }
      if (!assignedToId) {
        toast.error("Please assign a technician to the job.");
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTool || !issue.trim() || !assignedToId || isCalibrationRestricted) return;

    const assignedPerson = personnelList.find((p) => p.id === assignedToId);
    const assignedName = assignedPerson
      ? `${assignedPerson.firstName} ${assignedPerson.lastName}`
      : "Assigned Engineer";

    setCreating(true);
    try {
      const createdJob = await toolsJobService.create(
        {
          toolId: selectedTool.id,
          jobType,
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          assignedToId,
          assignedToName: assignedName,
          issue: issue.trim(),
          toolStatus,
        },
        {
          id: selectedTool.id,
          serialNumber: selectedTool.serialNumber,
          category: selectedTool.category,
          oem: selectedTool.oem,
          model: selectedTool.model,
          calibrationStatus: selectedTool.calibrationStatus,
          calibrationDate: selectedTool.lastCalibrationDate,
          calibrationDueDate: selectedTool.nextCalibrationDate,
          warrantyStatus: selectedTool.warrantyStatus,
          vendor: selectedTool.vendor,
        },
      );

      toast.success(`Job ${createdJob.jobNumber} created successfully.`);
      onOpenChange(false);
      onJobCreated?.(createdJob);
    } catch (err) {
      console.error("Error creating job", err);
      toast.error("Failed to create job.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <StepperModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create Tools Job"
      description="Register maintenance, warranty, or calibration job"
      steps={STEPS}
      currentStep={currentStep}
      onStepClick={(idx) => {
        if (idx === 0) setCurrentStep(0);
        else if (idx === 1 && canProceedFromStep0) setCurrentStep(1);
        else if (idx === 2 && canProceedFromStep1) setCurrentStep(2);
      }}
      onBack={handleBack}
      onNext={handleNext}
      onSubmit={handleSubmit}
      isSubmitting={creating}
      canProceed={currentStep === 0 ? canProceedFromStep0 : canProceedFromStep1}
      canSubmit={!isCalibrationRestricted && Boolean(issue.trim())}
      submitLabel="Create Job"
      submitIcon={ClipboardCheck}
    >
          {/* STEP 1: SELECT EQUIPMENT */}
          {currentStep === 0 && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Choose Equipment to Assign
                </span>
                {selectedTool && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTool(null)}
                    className="text-xs h-7 text-primary hover:underline"
                  >
                    Change Selection
                  </Button>
                )}
              </div>

              {!selectedTool ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="size-4 text-muted-foreground absolute left-3 top-2.5" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by ID, S/N, model, OEM, category, vendor..."
                      className="pl-9 h-9 text-xs"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-border border border-border rounded-lg bg-card">
                    {filteredTools.length === 0 ? (
                      <p className="p-4 text-center text-xs text-muted-foreground">
                        No matching equipment found.
                      </p>
                    ) : (
                      filteredTools.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTool(t)}
                          className="p-3 hover:bg-accent/50 cursor-pointer flex items-center justify-between gap-3 transition-colors text-xs"
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                                {t.id}
                              </span>
                              <span className="text-foreground font-semibold">{t.model}</span>
                              <span className="text-muted-foreground">({t.oem})</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {t.category} &bull; S/N:{" "}
                              <span className="font-mono font-medium">{t.serialNumber}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <CalibrationStatusBadge status={t.calibrationStatus} />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                            >
                              Select
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-primary shrink-0" />
                      <span className="text-xs font-bold text-primary">
                        Selected: {selectedTool.id} — {selectedTool.model}
                      </span>
                    </div>
                    <CalibrationStatusBadge status={selectedTool.calibrationStatus} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-muted/30 border border-border text-xs">
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        Serial Number
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {selectedTool.serialNumber}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        Category
                      </span>
                      <span className="text-foreground font-medium">{selectedTool.category}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        OEM
                      </span>
                      <span className="text-foreground font-medium">{selectedTool.oem}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        Warranty
                      </span>
                      <div>
                        <StatusBadge status={selectedTool.warrantyStatus} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: JOB INFORMATION & ASSIGNMENT */}
          {currentStep === 1 && selectedTool && (
            <div className="space-y-4 animate-fade-in">
              {/* Calibration Restriction Warning */}
              {isCalibrationRestricted && (
                <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 space-y-1.5 text-rose-700 dark:text-rose-400">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>Tool unavailable for this job type</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    This tool ({selectedTool.id}) is expired for calibration and cannot be scheduled for {jobType}.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setJobType("Repair OOW")}
                    className="h-7 text-xs mt-1"
                  >
                    Change to Repair Job
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="jobType" className="text-xs">
                    Job Type *
                  </Label>
                  <select
                    id="jobType"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as JobType)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                    required
                  >
                    {jobTypes.map((jt) => (
                      <option key={jt} value={jt}>
                        {jt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="toolStatus" className="text-xs">
                    Physical Tool Status *
                  </Label>
                  <select
                    id="toolStatus"
                    value={toolStatus}
                    onChange={(e) => setToolStatus(e.target.value as ToolStatus)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                    required
                  >
                    <option value="Good">Good</option>
                    <option value="Partially working">Partially working</option>
                    <option value="Not working">Not working</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="assignedTo" className="text-xs">
                    Assigned Technician / Engineer *
                  </Label>
                  <select
                    id="assignedTo"
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                    required
                  >
                    {personnelList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} — {p.jobTitle} ({p.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="issue" className="text-xs">
                    Initial Issue / Scope of Work *
                  </Label>
                  <Textarea
                    id="issue"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    placeholder="Detail the failure symptoms, maintenance requirements, or calibration procedure..."
                    className="text-xs min-h-[90px]"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CONTACT & CONFIRMATION */}
          {currentStep === 2 && selectedTool && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contact Information (Optional)
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Vendor or hospital point-of-contact for this job ticket.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="contactName" className="text-xs">
                    Contact Name
                  </Label>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Representative name"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail" className="text-xs">
                    Contact Email
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@example.com"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="contactPhone" className="text-xs">
                    Contact Phone
                  </Label>
                  <Input
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (800) 000-0000"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Final Review Summary Card */}
              <div className="p-3.5 rounded-lg border border-border bg-card space-y-2.5 text-xs">
                <span className="font-bold text-foreground text-xs uppercase tracking-wider block">
                  Job Summary
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Equipment</span>
                    <span className="font-semibold text-foreground">
                      {selectedTool.id} ({selectedTool.model})
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Job Type</span>
                    <span className="font-semibold text-foreground">{jobType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Tool Status</span>
                    <span className="font-semibold text-foreground">{toolStatus}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Technician</span>
                    <span className="font-semibold text-foreground">
                      {personnelList.find((p) => p.id === assignedToId)?.firstName}{" "}
                      {personnelList.find((p) => p.id === assignedToId)?.lastName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
    </StepperModal>
  );
}
