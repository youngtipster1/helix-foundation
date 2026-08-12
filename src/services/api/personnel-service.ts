import { MOCK_PERSONNEL } from "@/mocks/personnel";
import type { Personnel } from "@/types";

import { respond } from "./client";

let store: Personnel[] = [...MOCK_PERSONNEL];
let counter = store.length;

export type PersonnelInput = Omit<Personnel, "id">;

export const personnelService = {
  list() {
    return respond(store);
  },

  create(input: PersonnelInput) {
    const created: Personnel = { id: `per_new_${++counter}`, ...input };
    store = [created, ...store];
    return respond(created);
  },

  update(id: string, input: PersonnelInput) {
    store = store.map((person) => (person.id === id ? { ...person, ...input } : person));
    return respond(store.find((person) => person.id === id));
  },

  setStatus(id: string, status: Personnel["status"]) {
    store = store.map((person) => (person.id === id ? { ...person, status } : person));
    return respond(store.find((person) => person.id === id));
  },
};
