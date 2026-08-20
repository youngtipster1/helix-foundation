import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { qualityService } from "../services/quality-service";
import type { PolicyDocument, AssignTrainingInput } from "../types";
import { GraduationCap, Users, FileText, Calendar, CheckCircle2, ShieldCheck } from "lucide-react";

interface AssignTrainingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    input: AssignTrainingInput,
    userMap: Record<string, string>,
  ) => void;
}

const AVAILABLE_ENGINEERS = [
  { id: "usr_aisha", name: "Aisha", role: "Biomedical Specialist" },
  { id: "usr_aara", name: "Aara", role: "Clinical Engineer" },
  { id: "usr_tunde", name: "Tunde", role: "Biomedical Technician" },
  { id: "per_003", name: "Marcus Vance", role: "Field Service Engineer" },
  { id: "per_002", name: "Amara Okoye", role: "Senior Clinical Engineer" },
  { id: "per_004", name: "Sara Haddad", role: "Quality Technician" },
];

export function AssignTrainingModal({
  open,
  onOpenChange,
  onSubmit,
}: AssignTrainingModalProps) {
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadPolicies() {
      try {
        const docs = await qualityService.listPolicyDocuments();
        const activeDocs = docs.filter((d) => !d.isArchived);
        setPolicies(activeDocs);
        if (activeDocs.length > 0) {
          setSelectedPolicyId(activeDocs[0].id);
        }
      } catch (err) {
        console.error("Error loading policy documents", err);
      }
    }
    if (open) {
      loadPolicies();
      setSelectedUserIds(["usr_aara", "usr_tunde"]);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 14);
      setDueDate(nextWeek.toISOString().split("T")[0]);
      setNotes("");
    }
  }, [open]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const selectAllUsers = () => {
    setSelectedUserIds(AVAILABLE_ENGINEERS.map((u) => u.id));
  };

  const deselectAllUsers = () => {
    setSelectedUserIds([]);
  };

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy || selectedUserIds.length === 0) return;

    const userMap: Record<string, string> = {};
    AVAILABLE_ENGINEERS.forEach((u) => {
      userMap[u.id] = u.name;
    });

    setLoading(true);
    onSubmit(
      {
        trainingType: "policy_document",
        policyDocumentId: selectedPolicy.id,
        title: selectedPolicy.description,
        version: selectedPolicy.version || "v1.0",
        fileName: selectedPolicy.fileName || `${selectedPolicy.policyNumber}.pdf`,
        userIds: selectedUserIds,
        dueDate,
        notes,
      },
      userMap,
    );
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <GraduationCap className="size-5" />
            <DialogTitle>Assign Policy Document Training</DialogTitle>
          </div>
          <DialogDescription>
            Select an approved policy document from the quality registry and dispatch training to technicians.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Policy Document Select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Policy Document *</Label>
            <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Select Policy Document" />
              </SelectTrigger>
              <SelectContent>
                {policies.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.policyNumber} &bull; {p.description} ({p.version})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Policy Document Quick Preview Badge */}
          {selectedPolicy && (
            <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <FileText className="size-4 text-primary shrink-0" />
                <div>
                  <p className="font-bold text-foreground">{selectedPolicy.description}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Code: {selectedPolicy.policyNumber} &bull; Version: {selectedPolicy.version} &bull; Status: {selectedPolicy.status}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* User Multi-Selection (Only Technicians) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Assign To Technicians ({selectedUserIds.length} selected) *
              </Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllUsers}
                  className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-muted-foreground text-xs">&bull;</span>
                <button
                  type="button"
                  onClick={deselectAllUsers}
                  className="text-[11px] text-muted-foreground hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-lg border border-border bg-muted/20 max-h-48 overflow-y-auto">
              {AVAILABLE_ENGINEERS.map((engineer) => {
                const isSelected = selectedUserIds.includes(engineer.id);
                return (
                  <button
                    type="button"
                    key={engineer.id}
                    onClick={() => toggleUser(engineer.id)}
                    className={`flex items-start gap-2.5 p-2 rounded-md border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary/50 text-foreground"
                        : "bg-card border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-primary focus:ring-primary size-3.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">{engineer.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{engineer.role}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date & Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Target Completion Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Training Instructions / Scope</Label>
              <Input
                type="text"
                placeholder="e.g. Mandatory annual SOP compliance"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || selectedUserIds.length === 0}
              className="text-xs gap-1.5"
            >
              <GraduationCap className="size-3.5" />
              <span>Dispatch Policy Training</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
