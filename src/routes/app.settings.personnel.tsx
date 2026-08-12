import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Edit2, Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { personnelService, type PersonnelInput } from "@/modules/settings/services/personnel-service";
import type { Personnel } from "@/modules/settings/types";

export const Route = createFileRoute("/app/settings/personnel")({
  head: () => ({
    meta: [
      { title: "Personnel Directory — HEMP" },
      { name: "description", content: "Manage system personnel registry and user roles." },
    ],
  }),
  component: PersonnelSettingsPage,
});

interface PersonnelFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personnel: Personnel | null;
  onSubmit: (input: PersonnelInput) => void;
}

function PersonnelFormModal({ open, onOpenChange, personnel, onSubmit }: PersonnelFormModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<"active" | "archived">("active");

  useEffect(() => {
    if (personnel) {
      setFirstName(personnel.firstName);
      setLastName(personnel.lastName);
      setEmail(personnel.email);
      setJobTitle(personnel.jobTitle);
      setDepartment(personnel.department);
      setStatus(personnel.status);
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setJobTitle("");
      setDepartment("");
      setStatus("active");
    }
  }, [personnel, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      jobTitle: jobTitle.trim(),
      department: department.trim(),
      status,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{personnel ? "Edit Personnel" : "Add Personnel"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane.smith@hemp.local"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Biomedical Engineer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Clinical Engineering"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "archived")}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!firstName.trim() || !lastName.trim() || !email.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PersonnelSettingsPage() {
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    personnelId: string;
    action: "archive" | "restore";
  }>({
    open: false,
    personnelId: "",
    action: "archive",
  });

  const fetchPersonnel = async () => {
    setLoading(true);
    try {
      const data = await personnelService.list();
      const sorted = [...data].sort((a, b) => {
        if (a.status === b.status) {
          return a.lastName.localeCompare(b.lastName);
        }
        return a.status === "active" ? -1 : 1;
      });
      setPersonnelList(sorted);
    } catch (err) {
      console.error("Error fetching personnel list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const handleAddClick = () => {
    setEditingPersonnel(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (person: Personnel) => {
    setEditingPersonnel(person);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (input: PersonnelInput) => {
    try {
      if (editingPersonnel) {
        await personnelService.update(editingPersonnel.id, input);
      } else {
        await personnelService.create(input);
      }
      fetchPersonnel();
    } catch (err) {
      console.error("Error saving personnel", err);
    }
  };

  const handleActionConfirm = async () => {
    const { personnelId, action } = confirmState;
    if (!personnelId) return;

    try {
      await personnelService.setStatus(personnelId, action === "archive" ? "archived" : "active");
      fetchPersonnel();
    } catch (err) {
      console.error(`Error ${action}ing personnel`, err);
    } finally {
      setConfirmState({ open: false, personnelId: "", action: "archive" });
    }
  };

  const columns: DataTableColumn<Personnel>[] = [
    {
      key: "name",
      header: "Name",
      value: (row) => `${row.firstName} ${row.lastName}`,
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.firstName} {row.lastName}</p>
          <p className="text-[11px] text-muted-foreground font-mono">{row.id}</p>
        </div>
      ),
      filterable: false,
    },
    {
      key: "status",
      header: "Status",
      value: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} />,
      filterable: true,
    },
    {
      key: "email",
      header: "Email",
      value: (row) => row.email,
      filterable: false,
      className: "text-muted-foreground",
    },
    {
      key: "jobTitle",
      header: "Job Title",
      value: (row) => row.jobTitle || "—",
      filterable: true,
      className: "font-medium",
    },
    {
      key: "department",
      header: "Department",
      value: (row) => row.department || "—",
      filterable: true,
      className: "text-muted-foreground",
    },
  ];

  const renderRowActions = (row: Personnel) => {
    const isArchived = row.status === "archived";
    return (
      <div className="flex justify-end gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => handleEditClick(row)}
          aria-label={`Edit ${row.firstName} ${row.lastName}`}
        >
          <Edit2 className="size-3.5" />
        </Button>
        {isArchived ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-emerald-600 dark:text-emerald-400"
            onClick={() =>
              setConfirmState({
                open: true,
                personnelId: row.id,
                action: "restore",
              })
            }
            aria-label={`Restore ${row.firstName} ${row.lastName}`}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive"
            onClick={() =>
              setConfirmState({
                open: true,
                personnelId: row.id,
                action: "archive",
              })
            }
            aria-label={`Archive ${row.firstName} ${row.lastName}`}
          >
            <Archive className="size-3.5" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        rows={personnelList}
        loading={loading}
        searchPlaceholder="Search personnel..."
        emptyTitle="No personnel records found"
        emptyDescription="Add a new personnel record to get started."
        toolbarActions={
          <Button size="sm" className="h-9 text-xs" onClick={handleAddClick}>
            <Plus className="size-3.5 mr-1" />
            Add Personnel
          </Button>
        }
        rowActions={renderRowActions}
      />

      <PersonnelFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        personnel={editingPersonnel}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((p) => ({ ...p, open }))}
        title={confirmState.action === "archive" ? "Archive Personnel" : "Restore Personnel"}
        description={
          confirmState.action === "archive"
            ? "Are you sure you want to archive this personnel record? They will remain in history but be inactive."
            : "Are you sure you want to restore this personnel record?"
        }
        confirmLabel={confirmState.action === "archive" ? "Archive" : "Restore"}
        variant={confirmState.action === "archive" ? "destructive" : "default"}
        onConfirm={handleActionConfirm}
      />
    </div>
  );
}
