import type { AuthResult, AuthService, Credentials, User } from "./types";
import { userAccountService } from "@/modules/settings/services/user-account-service";

const STORAGE_KEY = "hemp.session";

/** Development-only fallback credentials. */
export const DEMO_CREDENTIALS = {
  username: "johndoe",
  password: "hemp1234",
};

function read(storage: Storage | undefined): User | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export const mockAuthService: AuthService = {
  restore() {
    if (typeof window === "undefined") return null;
    return read(window.localStorage) ?? read(window.sessionStorage);
  },

  async signIn({ username, password, remember }: Credentials): Promise<AuthResult> {
    // Lookup user from mock accounts store
    const account = userAccountService.findByUsername(username);

    // Verify account exists, password matches, and account is active
    const matches = account && account.password === password && account.active;

    if (!matches || !account) {
      return { ok: false, error: "Invalid credentials or inactive account." };
    }

    const nameParts = account.personnelName.trim().split(/\s+/);
    let firstName = nameParts[0] || "User";
    let lastName = nameParts.slice(1).join(" ") || "";

    const titles = ["dr.", "dr", "mr.", "mr", "mrs.", "mrs", "ms.", "ms", "engr.", "engr", "prof.", "prof"];
    if (nameParts.length >= 3 && titles.includes(nameParts[0].toLowerCase())) {
      firstName = `${nameParts[0]} ${nameParts[1]}`;
      lastName = nameParts.slice(2).join(" ");
    }

    const loggedInUser: User = {
      id: account.id,
      firstName,
      lastName,
      username: account.username,
      isSuperAdmin: account.isSuperAdmin,
      permissions: account.permissions,
      role: account.isSuperAdmin
        ? "Super Admin"
        : account.permissions.management === "admin"
        ? "Management Admin"
        : account.permissions.assets === "admin"
        ? "Asset Admin"
        : account.permissions.assets === "user"
        ? "Asset User"
        : account.permissions.debrief === "admin"
        ? "Debrief Admin"
        : account.permissions.debrief === "user"
        ? "Debrief User"
        : account.permissions.financial === "admin"
        ? "Financial Admin"
        : account.permissions.financial === "user"
        ? "Financial User"
        : account.permissions["parts-inventory"] === "admin"
        ? "Parts Admin"
        : account.permissions["parts-inventory"] === "user"
        ? "Parts User"
        : account.permissions.tools === "admin"
        ? "Tools Admin"
        : account.permissions.tools === "user"
        ? "Tools User"
        : account.permissions.quality === "admin"
        ? "Quality Admin"
        : account.permissions.quality === "user"
        ? "Quality User"
        : "Standard User",
    };

    if (typeof window !== "undefined") {
      const storage = remember ? window.localStorage : window.sessionStorage;
      storage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
    }

    return { ok: true, user: loggedInUser };
  },

  async signOut() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
  },
};
