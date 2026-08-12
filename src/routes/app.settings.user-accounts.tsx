import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Edit2, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { userAccountService, type UserAccountInput } from "@/modules/settings/services/user-account-service";
import type { UserAccount } from "@/modules/settings/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/app/settings/user-accounts")({
  head: () => ({
    meta: [
      { title: "User Accounts — HEMP" },
      { name: "description", content: "Manage system user accounts, modules, and access roles." },
    ],
  }),
  component: UserAccountsPage,
});

interface AccountEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: UserAccount | null;
  onSubmit: (input: UserAccountInput) => void;
}

function AccountEditModal({ open, onOpenChange, account, onSubmit }: AccountEditModalProps) {
  const [role, setRole] = useState<UserAccount["role"]>("user");
  const [moduleAccess, setModuleAccess] = useState<UserAccount["module"]>("quality");

  useEffect(() => {
    if (account) {
      setRole(account.role);
      setModuleAccess(account.module);
    }
  }, [account, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    onSubmit({
      personnelId: account.personnelId,
      personnelName: account.personnelName,
      email: account.email,
      role,
      module: moduleAccess,
      active: account.active,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Account Access</DialogTitle>
        </DialogHeader>
        {account && (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">User Account</Label>
              <p className="font-semibold text-foreground">{account.personnelName}</p>
              <p className="text-xs text-muted-foreground font-mono">{account.email}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Access Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserAccount["role"])}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                <option value="user">Module User</option>
                <option value="admin">Module Admin</option>
                <option value="super-admin">Super Admin</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="module">Assigned Module</Label>
              <select
                id="module"
                value={moduleAccess}
                onChange={(e) => setModuleAccess(e.target.value as UserAccount["module"])}
                disabled={role === "super-admin"}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">All Modules (Super Admin only)</option>
                <option value="quality">Quality</option>
                <option value="tools">Tools</option>
                <option value="training">Training</option>
                <option value="parts-inventory">Parts Inventory</option>
                <option value="debrief">Debrief</option>
                <option value="management">Management</option>
              </select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function UserAccountsPage() {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals / Actions state
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    accountId: string;
    personnelName: string;
    active: boolean;
  }>({
    open: false,
    accountId: "",
    personnelName: "",
    active: false,
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await userAccountService.list();
      setAccounts(data);
    } catch (err) {
      console.error("Error fetching user accounts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleEditClick = (account: UserAccount) => {
    setEditingAccount(account);
    setIsEditOpen(true);
  };

  const handleFormSubmit = async (input: UserAccountInput) => {
    if (!editingAccount) return;
    try {
      await userAccountService.update(editingAccount.id, input);
      fetchAccounts();
    } catch (err) {
      console.error("Error updating account details", err);
    }
  };

  const handleToggleActiveClick = (account: UserAccount) => {
    setConfirmState({
      open: true,
      accountId: account.id,
      personnelName: account.personnelName,
      active: account.active,
    });
  };

  const handleConfirmToggleActive = async () => {
    const { accountId, active } = confirmState;
    if (!accountId) return;

    try {
      await userAccountService.setActive(accountId, !active);
      fetchAccounts();
    } catch (err) {
      console.error(`Error toggling account status`, err);
    } finally {
      setConfirmState({ open: false, accountId: "", personnelName: "", active: false });
    }
  };

  const columns: DataTableColumn<UserAccount>[] = [
    {
      key: "personnelName",
      header: "User Account",
      value: (row) => row.personnelName,
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.personnelName}</p>
          <p className="text-[11px] text-muted-foreground font-mono">{row.email}</p>
        </div>
      ),
      filterable: false,
    },
    {
      key: "role",
      header: "Access Role",
      value: (row) => row.role,
      cell: (row) => (
        <span className="capitalize font-semibold text-xs tracking-wide">
          {row.role.replace("-", " ")}
        </span>
      ),
      filterable: true,
    },
    {
      key: "module",
      header: "Module",
      value: (row) => row.module,
      cell: (row) => (
        <span className="capitalize font-mono text-xs text-muted-foreground">
          {row.module === "all" ? "All Modules" : row.module.replace("-", " ")}
        </span>
      ),
      filterable: true,
    },
    {
      key: "active",
      header: "Status",
      value: (row) => (row.active ? "active" : "inactive"),
      cell: (row) => (
        <StatusBadge
          status={row.active ? "active" : "inactive"}
          className={row.active ? "" : "bg-destructive/10 text-destructive border-destructive/20"}
        />
      ),
      filterable: true,
    },
    {
      key: "createdAt",
      header: "Created",
      value: (row) => row.createdAt,
      filterable: false,
      className: "font-mono text-xs text-muted-foreground",
    },
  ];

  const renderRowActions = (row: UserAccount) => {
    return (
      <div className="flex justify-end gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleEditClick(row)}
              aria-label={`Edit ${row.personnelName} settings`}
            >
              <Edit2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit Account</TooltipContent>
        </Tooltip>

        {row.active ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive"
                onClick={() => handleToggleActiveClick(row)}
                aria-label={`Deactivate ${row.personnelName} account`}
              >
                <XCircle className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Deactivate Account</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-emerald-600 dark:text-emerald-400"
                onClick={() => handleToggleActiveClick(row)}
                aria-label={`Activate ${row.personnelName} account`}
              >
                <CheckCircle2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Activate Account</TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        rows={accounts}
        loading={loading}
        searchPlaceholder="Search user accounts..."
        emptyTitle="No user accounts found"
        emptyDescription="System user registry is currently empty."
        rowActions={renderRowActions}
      />

      <AccountEditModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        account={editingAccount}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((p) => ({ ...p, open }))}
        title={confirmState.active ? "Deactivate Account" : "Activate Account"}
        description={
          confirmState.active
            ? `Are you sure you want to deactivate the user account for ${confirmState.personnelName}? They will no longer be able to log in to the workspace.`
            : `Are you sure you want to activate the user account for ${confirmState.personnelName}?`
        }
        confirmLabel={confirmState.active ? "Deactivate" : "Activate"}
        variant={confirmState.active ? "destructive" : "default"}
        onConfirm={handleConfirmToggleActive}
      />
    </div>
  );
}
