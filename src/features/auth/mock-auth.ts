import type { AuthResult, AuthService, Credentials, User } from "./types";

const STORAGE_KEY = "hemp.session";

/** Development-only credentials for the mocked authentication layer. */
export const DEMO_CREDENTIALS = {
  username: "johndoe",
  password: "hemp1234",
};

const MOCK_USER: User = {
  id: "usr_001",
  firstName: "John",
  lastName: "Doe",
  username: "johndoe",
  role: "Super Admin",
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

    const identifier = username.trim().toLowerCase();
    const matches =
      (identifier === DEMO_CREDENTIALS.username ||
        identifier === `${DEMO_CREDENTIALS.username}@hemp.local`) &&
      password === DEMO_CREDENTIALS.password;

    if (!matches) {
      return { ok: false, error: "Invalid credentials. Check your username and password." };
    }

    if (typeof window !== "undefined") {
      const storage = remember ? window.localStorage : window.sessionStorage;
      storage.setItem(STORAGE_KEY, JSON.stringify(MOCK_USER));
    }

    return { ok: true, user: MOCK_USER };
  },

  async signOut() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
  },
};
