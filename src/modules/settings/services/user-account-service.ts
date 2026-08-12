import { MOCK_USER_ACCOUNTS } from "../mocks/user-accounts";
import type { UserAccount } from "../types";
import { respond, today } from "@/services/api/client";

let store: UserAccount[] = [...MOCK_USER_ACCOUNTS];
let counter = store.length;

export type UserAccountInput = Pick<
  UserAccount,
  "personnelId" | "personnelName" | "email" | "username" | "password" | "isSuperAdmin" | "permissions" | "active"
>;

export const userAccountService = {
  list() {
    return respond(store);
  },

  // Added for mockup auth resolver
  findByUsername(username: string) {
    return store.find(
      (account) => account.username.toLowerCase() === username.trim().toLowerCase()
    );
  },

  create(input: UserAccountInput) {
    const created: UserAccount = { id: `acc_new_${++counter}`, createdAt: today(), ...input };
    store = [created, ...store];
    return respond(created);
  },

  update(id: string, input: UserAccountInput) {
    store = store.map((account) => {
      if (account.id !== id) return account;
      const password = input.password ? input.password : account.password;
      return { ...account, ...input, password };
    });
    return respond(store.find((account) => account.id === id));
  },

  setActive(id: string, active: boolean) {
    store = store.map((account) => (account.id === id ? { ...account, active } : account));
    return respond(store.find((account) => account.id === id));
  },

  activeCount() {
    return store.filter((account) => account.active).length;
  },
};
