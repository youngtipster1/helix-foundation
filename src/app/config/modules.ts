import {
  Activity,
  Boxes,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Users,
  UserSquare2,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ConfigDefinition, ModuleKey, ModuleStatus } from "@/types";

export type ModuleDefinition = {
  key: ModuleKey;
  label: string;
  to: string;
  icon: LucideIcon;
  status: ModuleStatus;
  summary: string;
};

export const MODULES: ModuleDefinition[] = [
  {
    key: "quality",
    label: "Quality",
    to: "/app/quality",
    icon: ClipboardCheck,
    status: "available",
    summary: "Quality configuration and document attributes.",
  },
  {
    key: "tools",
    label: "Tools",
    to: "/app/tools",
    icon: Wrench,
    status: "available",
    summary: "Tools configuration lists.",
  },
  {
    key: "debrief",
    label: "Debrief",
    to: "/app/debrief",
    icon: Activity,
    status: "coming-soon",
    summary: "Debrief workflows planned for a future phase.",
  },
  {
    key: "parts-inventory",
    label: "Parts Inventory",
    to: "/app/parts-inventory",
    icon: Boxes,
    status: "coming-soon",
    summary: "Parts inventory planned for a future phase.",
  },
  {
    key: "training",
    label: "Training",
    to: "/app/training",
    icon: GraduationCap,
    status: "coming-soon",
    summary: "Training records planned for a future phase.",
  },
  {
    key: "management",
    label: "Management",
    to: "/app/management",
    icon: ShieldCheck,
    status: "coming-soon",
    summary: "Management oversight planned for a future phase.",
  },
];

export const WORKSPACE_NAV = [
  { label: "Dashboard", to: "/app/dashboard", icon: LayoutDashboard },
  ...MODULES.map((module) => ({ label: module.label, to: module.to, icon: module.icon })),
];

export const SYSTEM_NAV = [
  { label: "People & Personnel", to: "/app/personnel", icon: UserSquare2 },
  { label: "User Accounts", to: "/app/users", icon: Users },
  { label: "Audit & Activity", to: "/app/audit", icon: Activity },
];

/** Quality configuration lists confirmed by the client. */
export const QUALITY_CONFIGS: ConfigDefinition[] = [
  {
    key: "quality.names",
    label: "Names",
    singular: "Name",
    helper: "Names available for selection in Quality records.",
  },
  {
    key: "quality.document-status",
    label: "Form / Document Status",
    singular: "Status",
    helper: "Lifecycle statuses used by Quality forms and documents.",
  },
  {
    key: "quality.equipment-oem",
    label: "Equipment OEM",
    singular: "OEM",
    helper: "Original equipment manufacturers referenced by Quality.",
  },
  {
    key: "quality.modality",
    label: "Modality",
    singular: "Modality",
    helper: "Clinical equipment modalities.",
  },
  {
    key: "quality.equipment-model",
    label: "Equipment Model",
    singular: "Model",
    helper: "Equipment models available for selection.",
  },
];

/** Tools configuration lists confirmed by the client. */
export const TOOLS_CONFIGS: ConfigDefinition[] = [
  {
    key: "tools.warranty-status",
    label: "Tools Warranty Status",
    singular: "Warranty Status",
    helper: "Warranty states applied to tools.",
  },
  {
    key: "tools.model",
    label: "Tools Model",
    singular: "Model",
    helper: "Tool models available for selection.",
  },
  {
    key: "tools.oem",
    label: "Tools OEM",
    singular: "OEM",
    helper: "Tool manufacturers available for selection.",
  },
];
