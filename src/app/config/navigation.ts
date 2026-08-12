import {
  LayoutDashboard,
  ClipboardCheck,
  Wrench,
  GraduationCap,
  Boxes,
  MessageSquareCode,
  Users,
  UserCheck,
  History,
  FileText,
  CheckSquare,
  ShieldCheck,
  Archive,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

export const SETTINGS_WORKSPACE_NAV: NavItem[] = [
  { label: "Dashboard", to: "/app/settings/dashboard", icon: LayoutDashboard },
  { label: "Quality", to: "/app/settings/quality", icon: ClipboardCheck },
  { label: "Tools", to: "/app/settings/tools", icon: Wrench },
  { label: "Training", to: "/app/settings/training", icon: GraduationCap },
  { label: "Parts Inventory", to: "/app/settings/parts-inventory", icon: Boxes },
  { label: "Debrief", to: "/app/settings/debrief", icon: MessageSquareCode },
];

export const SETTINGS_SYSTEM_NAV: NavItem[] = [
  { label: "Personnel", to: "/app/settings/personnel", icon: Users },
  { label: "User Accounts", to: "/app/settings/user-accounts", icon: UserCheck },
  { label: "Audit Log", to: "/app/settings/audit-log", icon: History },
];

export const QUALITY_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", to: "/app/quality/dashboard", icon: LayoutDashboard },
  { label: "Policy Documents", to: "/app/quality/policy-documents", icon: FileText },
  { label: "Equipment Checklists", to: "/app/quality/checklists", icon: ClipboardCheck },
  { label: "Reviews", to: "/app/quality/reviews", icon: CheckSquare },
  { label: "Approvals", to: "/app/quality/approvals", icon: ShieldCheck },
  { label: "Archive", to: "/app/quality/archive", icon: Archive },
];

export const QUALITY_USER_NAV: NavItem[] = [
  { label: "Policy Documents", to: "/app/quality/policy-documents", icon: FileText },
  { label: "Equipment Checklists", to: "/app/quality/checklists", icon: ClipboardCheck },
  { label: "My Tasks", to: "/app/quality/my-tasks", icon: CheckSquare },
  { label: "Archive", to: "/app/quality/archive", icon: Archive },
];
