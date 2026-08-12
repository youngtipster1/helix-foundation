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
