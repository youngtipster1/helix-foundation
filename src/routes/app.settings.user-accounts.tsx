import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Edit2, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { userAccountService, type UserAccountInput } from "@/modules/settings/services/user-account-service";
import type { UserAccount, ModulePermissions } from "@/modules/settings/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/settings/user-accounts")({
  head: () => ({
    meta: [
      { title: "User Accounts — HEMP" },
      { name: "description", content: "Manage system user accounts, modules, and access roles." },
    ],
  }),
  component: UserAccountsPage,
});

const MODULE_KEYS = [
  { key: "quality", label: "Quality" },
  { key: "tools", label: "Tools" },
  { key: "training", label: "Training" },
  { key: "parts-inventory", label: "Parts" },
  { key: "debrief", label: "Debrief" },
  { key: "management", label: "Management" },
] as const;

interface AccountEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: UserAccount | null;
  onSubmit: (input: UserAccountInput) => void;
}

function AccountEditModal({ open, onOpenChange, account, onSubmit }: AccountEditModalProps) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [permissions, setPermissions] = useState<ModulePermissions>({
    quality: null,
    tools: null,
    training: null,
    "parts-inventory": null,
    debrief: null,
    management: null,
  });

  useEffect(() => {
    if (account) {
      setIsSuperAdmin(account.isSuperAdmin);
      setPermissions(account.permissions || {
        quality: null,
        tools: null,
        training: null,
        "parts-inventory": null,
        debrief: null,
        management: null,
      });
    }
  }, [account, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    onSubmit({
      personnelId: account.personnelId,
      personnelName: account.personnelName,
      email: account.email,
      isSuperAdmin,
      permissions,
      active: account.active,
    });
    onOpenChange(false);
  };

  const handleCheck = (moduleKey: keyof ModulePermissions, level: "admin" | "user") => {
    setPermissions((prev) => {
      const current = prev[moduleKey];
      let next: typeof current = null;

      if (current === level) {
        next = null; // Toggle off if already active
      } else {
        next = level;
      }

      return {
        ...prev,
        [moduleKey]: next,
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Edit Account Access</DialogTitle>
        </DialogHeader>
        {account && (
          <form onSubmit={handleSubmit} className="space-y-6 py-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-4 border-b border-border">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">User Account</Label>
                <p className="text-base font-bold text-foreground">{account.personnelName}</p>
                <p className="text-xs text-muted-foreground font-mono">{account.email}</p>
              </div>

              {/* Super Admin Toggle Switch */}
              <div className="flex items-center gap-3 bg-accent/40 rounded-lg p-3 border border-border/80">
                <div className="space-y-0.5">
                  <Label htmlFor="super-admin-toggle" className="text-xs font-bold text-foreground cursor-pointer">
                    Super Admin Access
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Overrides granular module selections</p>
                </div>
                <input
                  id="super-admin-toggle"
                  type="checkbox"
                  checked={isSuperAdmin}
                  onChange={(e) => setIsSuperAdmin(e.target.checked)}
                  className="size-5 rounded border-input text-primary bg-background focus:ring-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Matrix Permission Table Grid */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Module Access Matrix
              </Label>
              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full border-collapse text-left text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wider w-1/4">
                        Role / Privilege
                      </th>
                      {MODULE_KEYS.map((mod) => (
                        <th
                          key={mod.key}
                          className="py-3 px-3 text-center font-semibold text-muted-foreground uppercase tracking-wider"
                        >
                          {mod.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr className="hover:bg-accent/10 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground">Admin Privilege</td>
                      {MODULE_KEYS.map((mod) => {
                        const isChecked = isSuperAdmin || permissions[mod.key] === "admin";
                        return (
                          <td key={mod.key} className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isSuperAdmin}
                              onChange={() => handleCheck(mod.key, "admin")}
                              className="size-4.5 rounded border-input text-primary bg-background focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-accent/10 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground">User Privilege</td>
                      {MODULE_KEYS.map((mod) => {
                        const isChecked = !isSuperAdmin && permissions[mod.key] === "user";
                        return (
                          <td key={mod.key} className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isSuperAdmin}
                              onChange={() => handleCheck(mod.key, "user")}
                              className="size-4.5 rounded border-input text-primary bg-background focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
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

  const getPermissionBadges = (row: UserAccount) => {
    if (row.isSuperAdmin) {
      return (
        <span className="inline-flex items-center rounded-md bg-primary/8 px-2 py-0.5 text-xs font-medium text-primary border border-primary/10">
          All Modules (Full Access)
        </span>
      );
    }

    const active = Object.entries(row.permissions)
      .filter(([_, level]) => level !== null)
      .map(([key, level]) => {
        const label = MODULE_KEYS.find((m) => m.key === key)?.label || key;
        return { label, level };
      });

    if (active.length === 0) {
      return <span className="text-xs text-muted-foreground font-mono italic">No Active Module Access</span>;
    }

    return (
      <div className="flex flex-wrap gap-1.5 max-w-md">
        {active.map(({ label, level }) => (
          <span
            key={label}
            className={cn(
              "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border uppercase tracking-wider",
              level === "admin"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/5"
                : "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400 dark:bg-blue-500/5"
            )}
          >
            {label}: {level}
          </span>
        ))}
      </div>
    );
  };

  const columns: DataTableColumn<UserAccount>[] = [
    {
      key: "personnelName",
      header: "User Account",
      value: (row) => row.personnelName,
      cell: (row) => (
        <div>
          <p className="font-semibold text-foreground">{row.personnelName}</p>
          <p className="text-[11px] text-muted-foreground font-mono">{row.email}</p>
        </div>
      ),
      filterable: false,
    },
    {
      key: "role",
      header: "Access Role",
      value: (row) => (row.isSuperAdmin ? "Super Admin" : "Standard User"),
      cell: (row) => (
        <span
          className={cn(
            "capitalize font-bold text-xs tracking-wide",
            row.isSuperAdmin ? "text-primary" : "text-muted-foreground"
          )}
        >
          {row.isSuperAdmin ? "Super Admin" : "Standard User"}
        </span>
      ),
      filterable: true,
    },
    {
      key: "permissions",
      header: "Module Permissions Map",
      value: (row) => (row.isSuperAdmin ? "all" : Object.keys(row.permissions).filter(k => row.permissions[k as keyof ModulePermissions] !== null).join(", ")),
      cell: (row) => getPermissionBadges(row),
      filterable: false,
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
