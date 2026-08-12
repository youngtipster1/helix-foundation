import { MOCK_CONFIG_RECORDS } from "@/mocks/config-records";
import type { ConfigInput, ConfigRecord } from "@/types";

import { respond, today } from "./client";

let store: ConfigRecord[] = [...MOCK_CONFIG_RECORDS];
let counter = store.length;

export const configService = {
  list(configKey: string) {
    return respond(store.filter((record) => record.configKey === configKey));
  },

  create(configKey: string, input: ConfigInput) {
    const created: ConfigRecord = {
      id: `cfg_new_${++counter}`,
      configKey,
      updatedAt: today(),
      ...input,
    };
    store = [created, ...store];
    return respond(created);
  },

  update(id: string, input: ConfigInput) {
    let updated: ConfigRecord | undefined;
    store = store.map((record) => {
      if (record.id !== id) return record;
      updated = { ...record, ...input, updatedAt: today() };
      return updated;
    });
    return respond(updated);
  },

  setStatus(id: string, status: ConfigRecord["status"]) {
    store = store.map((record) =>
      record.id === id ? { ...record, status, updatedAt: today() } : record,
    );
    return respond(store.find((record) => record.id === id));
  },

  countByPrefix(prefix: string) {
    return store.filter((record) => record.configKey.startsWith(prefix)).length;
  },
};
