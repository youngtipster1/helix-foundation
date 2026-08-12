import type { AuditEvent } from "@/types";

export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "aud_001",
    user: "John Doe",
    action: "User account created",
    module: "User Accounts",
    timestamp: "2026-07-18 09:24",
    context: "Sara Haddad — Tools Admin",
    status: "success",
  },
  {
    id: "aud_002",
    user: "Liam Fischer",
    action: "Quality configuration updated",
    module: "Quality",
    timestamp: "2026-07-21 14:05",
    context: "Equipment OEM — added Philips",
    status: "success",
  },
  {
    id: "aud_003",
    user: "Sara Haddad",
    action: "Tools configuration updated",
    module: "Tools",
    timestamp: "2026-07-22 11:47",
    context: "Tools Model — added Fluke ESA615",
    status: "success",
  },
  {
    id: "aud_004",
    user: "John Doe",
    action: "Account deactivated",
    module: "User Accounts",
    timestamp: "2026-07-26 16:12",
    context: "Sara Haddad",
    status: "warning",
  },
  {
    id: "aud_005",
    user: "Amara Okoye",
    action: "Sign-in attempt failed",
    module: "Authentication",
    timestamp: "2026-07-29 08:03",
    context: "Incorrect password",
    status: "failed",
  },
];
