import type { User } from "./types";
import type { ModuleKey, PermissionLevel } from "@/modules/settings/types";

/**
 * Returns the effective permission level ("admin" | "user" | null) for a given module.
 * Future backend permissions and dynamic role assignments map cleanly through here.
 */
export function getModulePermission(
  user: User | null | undefined,
  moduleKey: ModuleKey | "settings" | "quality" | "tools",
): PermissionLevel {
  if (!user) return null;

  // Super Admin has admin access across all modules by default
  if (user.isSuperAdmin || user.role === "Super Admin") {
    return "admin";
  }

  // Check explicit permission map if present
  if (user.permissions) {
    const perm = user.permissions[moduleKey as keyof typeof user.permissions];
    if (perm) return perm;
  }

  // Role-based fallbacks
  const roleLower = user.role.toLowerCase();

  if (moduleKey === "quality") {
    if (roleLower.includes("quality admin")) return "admin";
    if (roleLower.includes("quality")) return "user";
  }

  if (moduleKey === "tools") {
    if (roleLower.includes("tools admin")) return "admin";
    if (roleLower.includes("tools")) return "user";
  }

  if (moduleKey === "settings") {
    if (roleLower.includes("admin")) return "admin";
  }

  return null;
}

/**
 * Checks if the user is authorized to enter a specific workspace module.
 */
export function hasModuleAccess(
  user: User | null | undefined,
  moduleKey: ModuleKey | "settings" | "quality" | "tools" | string,
): boolean {
  if (!user) return false;
  if (user.isSuperAdmin || user.role === "Super Admin") return true;

  const level = getModulePermission(user, moduleKey as any);
  if (level !== null) return true;

  // By default, standard users can access available public workspace tools
  if (moduleKey === "tools" || moduleKey === "quality") {
    return true;
  }

  return false;
}

/**
 * Check if the user has administrative privileges for a specific module.
 */
export function isModuleAdmin(
  user: User | null | undefined,
  moduleKey: ModuleKey | "settings" | "quality" | "tools",
): boolean {
  return getModulePermission(user, moduleKey) === "admin";
}
