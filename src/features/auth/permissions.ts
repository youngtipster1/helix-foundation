import type { User } from "./types";
import type { ModuleKey, PermissionLevel } from "@/modules/settings/types";

/**
 * Returns the effective permission level ("admin" | "user" | null) for a given module.
 * Future backend permissions and dynamic role assignments map cleanly through here.
 */
export function getModulePermission(
  user: User | null | undefined,
  moduleKey: ModuleKey | "settings" | "quality" | "tools" | "parts" | "parts-inventory" | string,
): PermissionLevel {
  if (!user) return null;

  // Super Admin has admin access across all modules by default
  if (user.isSuperAdmin || user.role === "Super Admin") {
    return "admin";
  }

  // Check explicit permission map if present
  if (user.permissions) {
    if (moduleKey === "parts" || moduleKey === "parts-inventory") {
      const partsPerm =
        user.permissions["parts-inventory"] ?? (user.permissions as any).parts;
      return partsPerm ?? null;
    }
    if (moduleKey === "financial" || moduleKey === "financials") {
      const finPerm = user.permissions.financial ?? (user.permissions as any).financials;
      return finPerm ?? null;
    }
    if (moduleKey === "assets" || moduleKey === "asset") {
      const assetsPerm = user.permissions.assets ?? (user.permissions as any).asset;
      return assetsPerm ?? null;
    }
    if (moduleKey === "debrief") {
      const debriefPerm = (user.permissions as any).debrief;
      return debriefPerm ?? "admin";
    }
    if (moduleKey === "settings") {
      const settingsPerm = (user.permissions as any).settings;
      return settingsPerm ?? null;
    }
    if (moduleKey === "management") {
      const mgmtPerm = (user.permissions as any).management;
      return mgmtPerm ?? "admin";
    }
    const perm = user.permissions[moduleKey as keyof typeof user.permissions];
    return perm ?? null;
  }

  // Strict role-based fallbacks (only used if explicit permissions map is not present)
  const roleLower = (user.role || "").toLowerCase();

  if (moduleKey === "management") {
    return "admin";
  }

  if (moduleKey === "quality") {
    if (roleLower.includes("quality admin")) return "admin";
    if (roleLower.includes("quality")) return "user";
  }

  if (moduleKey === "tools") {
    if (roleLower.includes("tools admin")) return "admin";
    if (roleLower.includes("tools")) return "user";
  }

  if (moduleKey === "settings") {
    if (roleLower === "system admin" || roleLower === "super admin") return "admin";
  }

  if (moduleKey === "parts" || moduleKey === "parts-inventory") {
    if (roleLower.includes("parts admin")) return "admin";
    if (roleLower.includes("parts user")) return "user";
  }

  if (moduleKey === "financial" || moduleKey === "financials") {
    if (roleLower.includes("financial admin") || roleLower.includes("finance admin")) return "admin";
    if (roleLower.includes("financial user") || roleLower.includes("finance user")) return "user";
  }

  if (moduleKey === "assets" || moduleKey === "asset") {
    if (roleLower.includes("asset admin") || roleLower.includes("assets admin")) return "admin";
    if (roleLower.includes("asset user") || roleLower.includes("assets user")) return "user";
  }

  if (moduleKey === "debrief") {
    if (roleLower.includes("debrief admin")) return "admin";
    return "admin";
  }

  return null;
}

/**
 * Checks if the user is authorized to enter a specific workspace module.
 */
export function hasModuleAccess(
  user: User | null | undefined,
  moduleKey: ModuleKey | "settings" | "quality" | "tools" | "parts" | string,
): boolean {
  if (!user) return false;
  if (user.isSuperAdmin || user.role === "Super Admin") return true;

  const level = getModulePermission(user, moduleKey as any);
  return level !== null;
}

/**
 * Check if the user has administrative privileges for a specific module.
 */
export function isModuleAdmin(
  user: User | null | undefined,
  moduleKey: ModuleKey | "settings" | "quality" | "tools" | "parts" | "parts-inventory" | string,
): boolean {
  return getModulePermission(user, moduleKey) === "admin";
}
