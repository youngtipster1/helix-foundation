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
    await new Promise((resolve) => setTimeout(resolve, 450));

    // Lookup user from mock accounts store
    const account = userAccountService.findByUsername(username);

    // Verify account exists, password matches, and account is active
    const matches = account && account.password === password && account.active;

    if (!matches || !account) {
      return { ok: false, error: "Invalid credentials or inactive account." };
    }

    const nameParts = account.personnelName.split(" ");
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || "";

    const loggedInUser: User = {
      id: account.id,
      firstName,
      lastName,
      username: account.username,
      role: account.isSuperAdmin
        ? "Super Admin"
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
