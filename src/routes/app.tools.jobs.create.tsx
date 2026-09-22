import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  UserCheck,
  ClipboardCheck,
  ShieldAlert,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/features/auth/auth-context";
import { toolsService } from "@/modules/tools/services/tools-service";
import { toolsJobService } from "@/modules/tools/services/tools-job-service";
import { toolsSettingsService } from "@/modules/tools/services/tools-settings-service";
import { personnelService } from "@/modules/settings/services/personnel-service";
import type { Tool, JobType, ToolStatus } from "@/modules/tools/types";
import type { Personnel } from "@/modules/settings/types";
import { CalibrationStatusBadge } from "@/modules/tools/components/calibration-status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tools/jobs/create")({
  head: () => ({
    meta: [
      { title: "Create Tools Job — HEMP" },
      { name: "description", content: "Create and assign a new repair, warranty, or calibration job for equipment." },
    ],
  }),
  component: CreateToolsJobPage,
});

function CreateToolsJobPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Admin access guard
  const isToolsAdmin = Boolean(
    user?.isSuperAdmin ||
      user?.permissions?.tools === "admin" ||
      user?.role === "Tools Admin" ||
      user?.role === "Super Admin",
  );

  const [toolsList, setToolsList] = useState<Tool[]>([]);
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

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
    async function loadData() {
      const [tools, personnel, types] = await Promise.all([
        toolsService.list(),
        personnelService.list(),
        toolsSettingsService.getJobTypes(),
      ]);
      setToolsList(tools);
      setPersonnelList(personnel.filter((p) => p.status === "active"));
      setJobTypes(types);

      if (personnel.length > 0) {
        setAssignedToId(personnel[0].id);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTool) {
      setContactName(selectedTool.vendorContact || "");
      setContactEmail(selectedTool.vendorEmail || "");
      setContactPhone(selectedTool.vendorPhone || "");
    }
  }, [selectedTool]);

  if (!isToolsAdmin) {
    return (
      <div className="surface-panel p-8 text-center space-y-4 max-w-md mx-auto my-12">
        <ShieldAlert className="size-10 text-destructive mx-auto" />
        <h2 className="text-base font-bold text-foreground">Access Restricted</h2>
        <p className="text-xs text-muted-foreground">
          Only Tools Administrators have permission to initiate and assign new equipment jobs.
        </p>
        <Button size="sm" variant="outline" onClick={() => navigate({ to: "/app/tools/jobs" })} className="text-xs">
          Return to Tools Jobs
        </Button>
      </div>
    );
  }

  // Filter tools based on query
  const filteredTools = toolsList.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.serialNumber.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.oem.toLowerCase().includes(q) ||
      t.model.toLowerCase().includes(q) ||
      t.vendor.toLowerCase().includes(q)
    );
  });

  // Calibration restriction rule:
  // If job type is Calibration (or requires valid calibration) AND tool calibration is expired -> BLOCK
  const isCalibrationRestricted =
    selectedTool !== null &&
    toolsJobService.jobTypeRequiresCalibration(jobType) &&
    selectedTool.calibrationStatus === "expired";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool || !issue.trim() || !assignedToId || isCalibrationRestricted) return;

    const assignedPerson = personnelList.find((p) => p.id === assignedToId);
    const assignedName = assignedPerson ? `${assignedPerson.firstName} ${assignedPerson.lastName}` : "Assigned Engineer";

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
      navigate({ to: "/app/tools/jobs/$jobId", params: { jobId: createdJob.jobNumber } });
    } catch (err) {
      console.error("Error creating job", err);
      toast.error("Failed to create job.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/app/tools/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Tools Jobs</span>
        </Link>
      </div>

      <PageHeader
        eyebrow="Equipment Fleet"
        title="Create Tools Job"
        subtitle="Step-by-step equipment job registration, calibration verification, and technician assignment."
      />

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* STEP 1: SELECT TOOL */}
        <div className="surface-panel p-3.5 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                1
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Select Equipment
              </h2>
            </div>
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
                  placeholder="Search tools by ID, S/N, model, OEM, category, vendor..."
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-border border border-border rounded-lg bg-card">
                {filteredTools.length === 0 ? (
                  <p className="p-4 text-center text-xs text-muted-foreground">
                    No matching equipment found.
                  </p>
                ) : (
                  filteredTools.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTool(t)}
                      className="p-3 hover:bg-accent/40 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors text-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                            {t.id}
                          </span>
                          <span className="text-foreground font-semibold text-xs">{t.model}</span>
                          <span className="text-muted-foreground text-xs">({t.oem})</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {t.category} &bull; S/N: <span className="font-mono font-medium">{t.serialNumber}</span> &bull; {t.vendor}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
                        <CalibrationStatusBadge status={t.calibrationStatus} />
                        <Button type="button" size="sm" variant="outline" className="h-7 text-xs">
                          Select
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* STEP 2: AUTOMATIC READ-ONLY TOOL POPULATION */
            <div className="space-y-3">
              <div className="p-3 sm:p-3.5 rounded-lg bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">
                    Selected Tool: {selectedTool.id} — {selectedTool.model}
                  </span>
                </div>
                <div className="self-start sm:self-auto">
                  <CalibrationStatusBadge status={selectedTool.calibrationStatus} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 sm:p-4 rounded-lg bg-muted/20 border border-border text-xs">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Tools ID</span>
                  <span className="font-mono font-bold text-foreground">{selectedTool.id}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Serial Number</span>
                  <span className="font-mono text-foreground font-semibold">{selectedTool.serialNumber}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Category</span>
                  <span className="text-foreground">{selectedTool.category}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">OEM</span>
                  <span className="text-foreground">{selectedTool.oem}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Calibration Date</span>
                  <span className="font-mono text-muted-foreground">{selectedTool.lastCalibrationDate}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Calibration Due</span>
                  <span className="font-mono font-bold text-foreground">{selectedTool.nextCalibrationDate}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Warranty Status</span>
                  <StatusBadge status={selectedTool.warrantyStatus} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Vendor</span>
                  <span className="text-muted-foreground truncate block">{selectedTool.vendor}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: JOB DETAILS & CALIBRATION RESTRICTION CHECK */}
        {selectedTool && (
          <div className="surface-panel p-3.5 sm:p-5 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                2
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Job Information & Technician Assignment
              </h2>
            </div>

            {/* Rule 23: Calibration Job Restriction Banner */}
            {isCalibrationRestricted && (
              <div className="p-3.5 sm:p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 space-y-2 text-rose-700 dark:text-rose-400 animate-fade-in">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>Tool unavailable for this job type</span>
                </div>
                <p className="text-xs leading-relaxed">
                  This tool ({selectedTool.id}) is currently out of calibration (Next Calibration Due: {selectedTool.nextCalibrationDate}) and cannot be used for this job type ({jobType}).
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-muted-foreground">Options:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setJobType("Repair OOW")}
                    className="h-7 text-xs"
                  >
                    Change to Repair Job
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTool(null)}
                    className="h-7 text-xs text-rose-600 hover:underline"
                  >
                    Select Another Tool
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="jobType" className="text-xs">Job Type *</Label>
                <select
                  id="jobType"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as JobType)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                  required
                >
                  {jobTypes.map((jt) => (
                    <option key={jt} value={jt}>{jt}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="toolStatus" className="text-xs">Tool Status *</Label>
                <select
                  id="toolStatus"
                  value={toolStatus}
                  onChange={(e) => setToolStatus(e.target.value as ToolStatus)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                  required
                >
                  <option value="Good">Good</option>
                  <option value="Partially working">Partially working</option>
                  <option value="Not working">Not working</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="assignedTo" className="text-xs">Assigned Technician / Engineer *</Label>
                <select
                  id="assignedTo"
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                  required
                >
                  {personnelList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} — {p.jobTitle} ({p.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactName" className="text-xs">Contact Person</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Representative name"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactEmail" className="text-xs">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@vendor.com"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="contactPhone" className="text-xs">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (800) 000-0000"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="issue" className="text-xs">Initial Issue / Scope of Work *</Label>
                <Textarea
                  id="issue"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="Detail the failure symptoms, scheduled calibration scope, or maintenance requirements..."
                  className="text-xs min-h-[80px]"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/app/tools/jobs" })}
                className="text-xs w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={creating || isCalibrationRestricted || !issue.trim()}
                className="text-xs gap-1.5 w-full sm:w-auto"
              >
                <ClipboardCheck className="size-3.5" />
                <span>{creating ? "Creating Job..." : "Create Job"}</span>
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
