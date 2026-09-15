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
  Zap,
  DollarSign,
  Receipt,
  FileCheck,
  ArrowLeftRight,
  Stethoscope,
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
  { label: "Training & Compliance", to: "/app/quality/training", icon: GraduationCap },
  { label: "Reviews", to: "/app/quality/reviews", icon: CheckSquare },
  { label: "Approvals", to: "/app/quality/approvals", icon: ShieldCheck },
  { label: "Archive", to: "/app/quality/archive", icon: Archive },
];

export const QUALITY_USER_NAV: NavItem[] = [
  { label: "Training & Compliance", to: "/app/quality/training", icon: GraduationCap },
  { label: "My Tasks", to: "/app/quality/my-tasks", icon: CheckSquare },
  { label: "Equipment Checklists", to: "/app/quality/checklists", icon: ClipboardCheck },
  { label: "Policy Documents", to: "/app/quality/policy-documents", icon: FileText },
  { label: "Archive", to: "/app/quality/archive", icon: Archive },
];

/* =========================================================================
   TOOLS MODULE — FLAT MAIN MENU (ADMIN)
========================================================================= */
export const TOOLS_ADMIN_MAIN_NAV: NavItem[] = [
  { label: "Dashboard", to: "/app/tools/dashboard", icon: LayoutDashboard },
  { label: "Tools Registry", to: "/app/tools", icon: Wrench },
  { label: "All Jobs", to: "/app/tools/jobs", icon: ClipboardCheck },
  { label: "Open Jobs", to: "/app/tools/jobs/open", icon: Zap },
  { label: "Expense Approvals", to: "/app/tools/expense-approvals", icon: DollarSign },
  { label: "Documents", to: "/app/tools/documents", icon: FileCheck },
];

export const TOOLS_ADMIN_ARCHIVE_NAV: NavItem[] = [
  { label: "Archived Tools", to: "/app/tools/archived-tools", icon: Archive },
  { label: "Archived Jobs", to: "/app/tools/archived-jobs", icon: History },
];

/* =========================================================================
   TOOLS MODULE — FLAT MAIN MENU (USER)
========================================================================= */
export const TOOLS_USER_MAIN_NAV: NavItem[] = [
  { label: "My Jobs", to: "/app/tools/my-jobs", icon: ClipboardCheck },
  { label: "Tools Registry", to: "/app/tools", icon: Wrench },
  { label: "My Expenses", to: "/app/tools/my-expenses", icon: Receipt },
  { label: "Documents", to: "/app/tools/documents", icon: FileCheck },
];

/* =========================================================================
   PARTS MODULE — 4-TAB MAIN NAVIGATION (USER & ADMIN)
========================================================================= */
export const PARTS_MAIN_NAV: NavItem[] = [
  { label: "Dashboard", to: "/app/parts/dashboard", icon: LayoutDashboard },
  { label: "Parts List", to: "/app/parts/list", icon: Boxes },
  { label: "Stock Movements", to: "/app/parts/movements", icon: ArrowLeftRight },
  { label: "Parts Audit", to: "/app/parts/audit", icon: ClipboardCheck },
];

/* =========================================================================
   FINANCIAL MODULE — 4-TAB MAIN NAVIGATION (USER & ADMIN)
========================================================================= */
export const FINANCIAL_NAV: NavItem[] = [
  { label: "Dashboard", to: "/app/financial/dashboard", icon: LayoutDashboard },
  { label: "Orders", to: "/app/financial/orders", icon: ClipboardCheck },
  { label: "Purchase Orders", to: "/app/financial/purchase-orders", icon: Receipt },
  { label: "Service Contracts", to: "/app/financial/service-contracts", icon: FileText },
];

/* =========================================================================
   ASSETS MODULE — 4-TAB MAIN NAVIGATION (USER & ADMIN)
========================================================================= */
export const ASSETS_NAV: NavItem[] = [
  { label: "Dashboard", to: "/app/assets/dashboard", icon: LayoutDashboard },
  { label: "Asset list", to: "/app/assets/list", icon: Stethoscope },
  { label: "Service contract", to: "/app/assets/contracts-dashboard", icon: FileCheck },
  { label: "Service list", to: "/app/assets/contracts", icon: FileText },
];


