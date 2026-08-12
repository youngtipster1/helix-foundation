import type { UserAccount } from "../types";

export const MOCK_USER_ACCOUNTS: UserAccount[] = [
  {
    id: "acc_001",
    personnelId: "per_001",
    personnelName: "John Doe",
    module: "all",
    role: "super-admin",
    email: "john.doe@hemp.local",
    active: true,
    createdAt: "2026-06-01",
  },
  {
    id: "acc_002",
    personnelId: "per_003",
    personnelName: "Liam Fischer",
    module: "quality",
    role: "admin",
    email: "liam.fischer@hemp.local",
    active: true,
    createdAt: "2026-07-02",
  },
  {
    id: "acc_003",
    personnelId: "per_002",
    personnelName: "Amara Okoye",
    module: "quality",
    role: "user",
    email: "amara.okoye@hemp.local",
    active: true,
    createdAt: "2026-07-10",
  },
  {
    id: "acc_004",
    personnelId: "per_004",
    personnelName: "Sara Haddad",
    module: "tools",
    role: "admin",
    email: "sara.haddad@hemp.local",
    active: false,
    createdAt: "2026-07-18",
  },
];
