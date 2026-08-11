export type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
};

export type Credentials = {
  username: string;
  password: string;
  remember: boolean;
};

export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

/**
 * Contract for any auth implementation. The mock implementation can be swapped
 * for a Laravel-backed one without touching UI code.
 */
export interface AuthService {
  restore(): User | null;
  signIn(credentials: Credentials): Promise<AuthResult>;
  signOut(): Promise<void>;
}