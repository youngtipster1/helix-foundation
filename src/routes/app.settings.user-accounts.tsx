import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Edit2, ShieldAlert, CheckCircle2, XCircle, Plus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { userAccountService, type UserAccountInput } from "@/modules/settings/services/user-account-service";
import type { UserAccount, ModulePermissions } from "@/modules/settings/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { personnelService } from "@/modules/settings/services/personnel-service";
import type { Personnel } from "@/modules/settings/types";

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
  existingPersonnelIds: string[];
  onSubmit: (input: UserAccountInput) => void;
}

function AccountEditModal({ open, onOpenChange, account, existingPersonnelIds, onSubmit }: AccountEditModalProps) {
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [permissions, setPermissions] = useState<ModulePermissions>({
    quality: null,
    tools: null,
    training: null,
    "parts-inventory": null,
    debrief: null,
    management: null,
  });

  // Toggles for auto generation and password visibility
  const [autoGenUsername, setAutoGenUsername] = useState(false);
  const [autoGenPassword, setAutoGenPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function loadPersonnel() {
      try {
        const data = await personnelService.list();
        setPersonnelList(data);
      } catch (err) {
        console.error("Error loading personnel in user-accounts modal", err);
      }
    }
    if (open) {
      loadPersonnel();
    }
  }, [open]);

  useEffect(() => {
    if (account) {
      setSelectedPersonnelId(account.personnelId);
      setUsername(account.username);
      setPassword("");
      setIsSuperAdmin(account.isSuperAdmin);
      setPermissions(account.permissions || {
        quality: null,
        tools: null,
        training: null,
        "parts-inventory": null,
        debrief: null,
        management: null,
      });
      setAutoGenUsername(false);
      setAutoGenPassword(false);
    } else {
      setSelectedPersonnelId("");
      setUsername("");
      setPassword("");
      setIsSuperAdmin(false);
      setPermissions({
        quality: null,
        tools: null,
        training: null,
        "parts-inventory": null,
        debrief: null,
        management: null,
      });
      setAutoGenUsername(false);
      setAutoGenPassword(false);
    }
    setShowPassword(false);
  }, [account, open]);

  // Generate random password helper
  const generateRandomPassword = () => {
    return `hemp-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  useEffect(() => {
    if (!account && autoGenUsername && selectedPersonnelId) {
      const selected = personnelList.find((p) => p.id === selectedPersonnelId);
      if (selected) {
        const cleanUsername = `${selected.firstName}${selected.lastName}`
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        setUsername(cleanUsername);
      }
    } else if (!autoGenUsername && !account && selectedPersonnelId) {
      // Clear username if they toggled auto-generate OFF, so they can specify it manually
      setUsername("");
    }
  }, [selectedPersonnelId, autoGenUsername, account, personnelList]);

  useEffect(() => {
    if (!account && autoGenPassword) {
      setPassword(generateRandomPassword());
    } else if (!autoGenPassword && !account) {
      setPassword("");
    }
  }, [autoGenPassword, account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let pId = "";
    let pName = "";
    let pEmail = "";

    if (account) {
      pId = account.personnelId;
      pName = account.personnelName;
      pEmail = account.email;
    } else {
      const selected = personnelList.find((p) => p.id === selectedPersonnelId);
      if (!selected) return;
      pId = selected.id;
      pName = `${selected.firstName} ${selected.lastName}`;
      pEmail = selected.email;
    }

    if (!username.trim()) return;
    if (!account && !password) return; // Password required for create

    onSubmit({
      personnelId: pId,
      personnelName: pName,
      email: pEmail,
      username: username.trim(),
      password: password || undefined,
      isSuperAdmin,
      permissions,
      active: account ? account.active : true,
    });
    onOpenChange(false);
  };

  const handleCheck = (moduleKey: keyof ModulePermissions, level: "admin" | "user" | null) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: level,
    }));
  };

  const availablePersonnel = personnelList.filter(
    (p) => p.status === "active" && !existingPersonnelIds.includes(p.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{account ? "Edit Account Access" : "Create User Account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          
          {/* Associated Personnel Selector */}
          {account ? (
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">User Account</Label>
              <p className="text-base font-bold text-foreground">{account.personnelName}</p>
              <p className="text-xs text-muted-foreground font-mono">{account.email}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="personnelSelect">Select Personnel Member</Label>
              <select
                id="personnelSelect"
                value={selectedPersonnelId}
                onChange={(e) => setSelectedPersonnelId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                required
              >
                <option value="">-- Choose Personnel Member --</option>
                {availablePersonnel.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.jobTitle || "No Title"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Credentials Inputs (Username & Password) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="accountUsername">Username</Label>
                {!account && (
                  <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoGenUsername}
                      onChange={(e) => setAutoGenUsername(e.target.checked)}
                      className="rounded border-input text-primary bg-background focus:ring-primary size-3"
                    />
                    Auto-gen
                  </label>
                )}
              </div>
              <Input
                id="accountUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. johndoe"
                disabled={!!account || autoGenUsername} // Disabled if auto-gen is enabled or editing
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="accountPassword">
                  {account ? "New Password" : "Password"}
                </Label>
                {!account && (
                  <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoGenPassword}
                      onChange={(e) => setAutoGenPassword(e.target.checked)}
                      className="rounded border-input text-primary bg-background focus:ring-primary size-3"
                    />
                    Auto-gen
                  </label>
                )}
              </div>
              <div className="relative">
                <Input
                  id="accountPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={account ? "Leave blank to keep" : "••••••••"}
                  disabled={autoGenPassword} // Disabled if auto-gen is enabled
                  className="pr-8"
                  required={!account && !autoGenPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer size-5 flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Super Admin Toggle Switch */}
          <div className="flex items-center justify-between bg-accent/45 rounded-lg p-2.5 border border-border/80">
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

          {/* Module Privileges Picker */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Module Privileges
            </Label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {MODULE_KEYS.map((mod) => {
                const currentValue = isSuperAdmin ? "admin" : permissions[mod.key];

                return (
                  <div
                    key={mod.key}
                    className="flex items-center justify-between p-2 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-foreground">{mod.label}</span>
                    </div>

                    {/* Segmented Option Switcher */}
                    <div className="flex rounded-md border border-border p-0.5 bg-muted/30">
                      {(
                        [
                          { val: null, label: "None" },
                          { val: "user", label: "User" },
                          { val: "admin", label: "Admin" },
                        ] as const
                      ).map((option) => {
                        const isActive = currentValue === option.val;

                        return (
                          <button
                            key={option.label}
                            type="button"
                            disabled={isSuperAdmin}
                            onClick={() => handleCheck(mod.key, option.val)}
                            className={cn(
                              "px-2.5 py-0.5 text-[11px] font-medium rounded transition-all cursor-pointer",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground",
                              isSuperAdmin && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={(!account && !selectedPersonnelId) || !username.trim()}>
              {account ? "Save Changes" : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
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

  const handleCreateClick = () => {
    setEditingAccount(null);
    setIsEditOpen(true);
  };

  const handleEditClick = (account: UserAccount) => {
    setEditingAccount(account);
    setIsEditOpen(true);
  };

  const handleFormSubmit = async (input: UserAccountInput) => {
    try {
      if (editingAccount) {
        await userAccountService.update(editingAccount.id, input);
      } else {
        await userAccountService.create(input);
      }
      fetchAccounts();
    } catch (err) {
      console.error("Error saving user account", err);
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
        <span className="inline-flex items-center rounded-md bg-primary/8 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/10 tracking-wide">
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
          <p className="text-[11px] text-muted-foreground font-mono">
            {row.email} &bull; <span className="font-bold text-foreground">@{row.username}</span>
          </p>
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
      value: (row) =>
        row.isSuperAdmin
          ? "all"
          : Object.keys(row.permissions)
              .filter((k) => row.permissions[k as keyof ModulePermissions] !== null)
              .join(", "),
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

  const existingPersonnelIds = accounts.map((a) => a.personnelId);

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        rows={accounts}
        loading={loading}
        searchPlaceholder="Search user accounts..."
        emptyTitle="No user accounts found"
        emptyDescription="System user registry is currently empty."
        toolbarActions={
          <Button size="sm" className="h-9 text-xs" onClick={handleCreateClick}>
            <Plus className="size-3.5 mr-1" />
            Create User Account
          </Button>
        }
        rowActions={renderRowActions}
      />

      <AccountEditModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        account={editingAccount}
        existingPersonnelIds={existingPersonnelIds}
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
