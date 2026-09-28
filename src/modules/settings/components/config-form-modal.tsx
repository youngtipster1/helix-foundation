import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConfigRecord } from "../types";

interface ConfigFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  record?: ConfigRecord | null;
  onSubmit: (label: string, status: "active" | "archived", description: string) => void;
}

export function ConfigFormModal({
  open,
  onOpenChange,
  title,
  record,
  onSubmit,
}: ConfigFormModalProps) {
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<"active" | "archived">("active");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (record) {
      setLabel(record.label);
      setStatus(record.status);
      setDescription(record.description || "");
    } else {
      setLabel("");
      setStatus("active");
      setDescription("");
    }
  }, [record, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    onSubmit(label.trim(), status, description.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-card/50 shrink-0">
          <DialogTitle className="text-base sm:text-lg font-bold text-foreground">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="label" className="text-xs">Name / Value *</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Active, GE Healthcare"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "archived")}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes or details"
              className="h-9 text-xs"
            />
          </div>
        </form>

        <DialogFooter className="p-3.5 sm:p-4 border-t border-border bg-card/60 shrink-0 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={!label.trim()} onClick={handleSubmit} className="text-xs">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
