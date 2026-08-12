import { MOCK_AUDIT_EVENTS } from "@/mocks/audit";

import { respond } from "./client";

export const auditService = {
  list() {
    return respond([...MOCK_AUDIT_EVENTS].reverse());
  },

  recent(limit = 3) {
    return [...MOCK_AUDIT_EVENTS].reverse().slice(0, limit);
  },
};
