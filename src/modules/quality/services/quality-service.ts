import { INITIAL_POLICY_DOCUMENTS, INITIAL_CHECKLISTS, INITIAL_ACTIVITIES } from "../mocks/quality-data";
import type { PolicyDocument, EquipmentChecklist, QualityActivity } from "../types";
import { respond, today } from "@/services/api/client";

let documentsStore: PolicyDocument[] = [...INITIAL_POLICY_DOCUMENTS];
let checklistsStore: EquipmentChecklist[] = [...INITIAL_CHECKLISTS];
let activitiesStore: QualityActivity[] = [...INITIAL_ACTIVITIES];

let docCounter = documentsStore.length;
let chkCounter = checklistsStore.length;
let actCounter = activitiesStore.length;

export type PolicyDocumentInput = Omit<PolicyDocument, "id" | "lastModified" | "isArchived">;
export type EquipmentChecklistInput = Omit<EquipmentChecklist, "id" | "lastModified" | "isArchived">;

export const qualityService = {
  // --- Policy Documents ---
  listDocuments(includeArchived = false) {
    const list = documentsStore.filter((doc) => includeArchived || !doc.isArchived);
    return respond(list);
  },

  createDocument(input: PolicyDocumentInput) {
    const created: PolicyDocument = {
      id: `doc_new_${++docCounter}`,
      lastModified: today() + " 12:00", // standard timestamp mockup
      isArchived: false,
      ...input,
    };
    documentsStore = [created, ...documentsStore];

    // Log activity
    this.logActivity({
      description: `${input.preparedByName} uploaded ${input.description}`,
      type: "upload",
      user: input.preparedByName,
      targetName: input.policyNumber,
    });

    return respond(created);
  },

  updateDocument(id: string, input: PolicyDocumentInput) {
    documentsStore = documentsStore.map((doc) => {
      if (doc.id !== id) return doc;
      
      // Log activity if status changed
      if (doc.status !== input.status) {
        this.logActivity({
          description: `${input.preparedByName} updated status of ${input.description} to ${input.status}`,
          type: input.status === "Approved" ? "approval" : "update",
          user: input.preparedByName,
          targetName: input.policyNumber,
        });
      }

      return { ...doc, ...input, lastModified: today() + " 12:00" };
    });
    return respond(documentsStore.find((doc) => doc.id === id));
  },

  setDocumentArchived(id: string, isArchived: boolean, userName: string) {
    const doc = documentsStore.find((d) => d.id === id);
    if (doc) {
      this.logActivity({
        description: `${userName} ${isArchived ? "archived" : "restored"} ${doc.description}`,
        type: isArchived ? "archive" : "restore",
        user: userName,
        targetName: doc.policyNumber,
      });
    }

    documentsStore = documentsStore.map((d) =>
      d.id === id ? { ...d, isArchived, lastModified: today() + " 12:00" } : d
    );
    return respond(documentsStore.find((d) => d.id === id));
  },

  // --- Equipment Checklists ---
  listChecklists(includeArchived = false) {
    const list = checklistsStore.filter((chk) => includeArchived || !chk.isArchived);
    return respond(list);
  },

  createChecklist(input: EquipmentChecklistInput) {
    const created: EquipmentChecklist = {
      id: `chk_new_${++chkCounter}`,
      lastModified: today() + " 12:00",
      isArchived: false,
      ...input,
    };
    checklistsStore = [created, ...checklistsStore];

    // Log activity
    this.logActivity({
      description: `${input.preparedByName} created checklist ${input.description}`,
      type: "upload",
      user: input.preparedByName,
      targetName: input.formNumber,
    });

    return respond(created);
  },

  updateChecklist(id: string, input: EquipmentChecklistInput) {
    checklistsStore = checklistsStore.map((chk) => {
      if (chk.id !== id) return chk;

      // Log activity if status changed
      if (chk.status !== input.status) {
        this.logActivity({
          description: `${input.preparedByName} updated status of checklist ${input.description} to ${input.status}`,
          type: input.status === "Approved" ? "approval" : "update",
          user: input.preparedByName,
          targetName: input.formNumber,
        });
      }

      return { ...chk, ...input, lastModified: today() + " 12:00" };
    });
    return respond(checklistsStore.find((chk) => chk.id === id));
  },

  setChecklistArchived(id: string, isArchived: boolean, userName: string) {
    const chk = checklistsStore.find((c) => c.id === id);
    if (chk) {
      this.logActivity({
        description: `${userName} ${isArchived ? "archived" : "restored"} checklist ${chk.description}`,
        type: isArchived ? "archive" : "restore",
        user: userName,
        targetName: chk.formNumber,
      });
    }

    checklistsStore = checklistsStore.map((c) =>
      c.id === id ? { ...c, isArchived, lastModified: today() + " 12:00" } : c
    );
    return respond(checklistsStore.find((c) => c.id === id));
  },

  // --- Activities ---
  listActivities() {
    return respond(activitiesStore);
  },

  logActivity(activity: Omit<QualityActivity, "id" | "timestamp">) {
    const created: QualityActivity = {
      id: `act_new_${++actCounter}`,
      timestamp: today() + " 12:00",
      ...activity,
    };
    activitiesStore = [created, ...activitiesStore];
  },

  // --- Dashboard Metrics helpers ---
  getDashboardMetrics() {
    const activeDocs = documentsStore.filter((d) => !d.isArchived);
    const activeChecklists = checklistsStore.filter((c) => !c.isArchived);

    const pendingReviews = activeDocs.filter((d) => d.status === "Under Review").length +
                           activeChecklists.filter((c) => c.status === "Under Review").length;

    const pendingApprovals = activeDocs.filter((d) => d.status === "Pending Approval").length +
                             activeChecklists.filter((c) => c.status === "Pending Approval").length;

    return respond({
      policyDocuments: activeDocs.filter((d) => d.status === "Approved").length,
      equipmentChecklists: activeChecklists.filter((c) => c.status === "Approved").length,
      pendingReviews,
      pendingApprovals,
    });
  },

  getAttentionRequired() {
    const activeDocs = documentsStore.filter((d) => !d.isArchived && (d.status === "Under Review" || d.status === "Pending Approval"));
    const activeChecklists = checklistsStore.filter((c) => !c.isArchived && (c.status === "Under Review" || c.status === "Pending Approval"));

    const items = [
      ...activeDocs.map((d) => ({
        id: d.id,
        type: "document" as const,
        description: d.description,
        identifier: d.policyNumber,
        actionRequired: d.status === "Under Review" ? "Review Document" : "Approve Document",
        status: d.status,
        preparedBy: d.preparedByName,
        lastUpdated: d.lastModified,
      })),
      ...activeChecklists.map((c) => ({
        id: c.id,
        type: "checklist" as const,
        description: c.description,
        identifier: c.formNumber,
        actionRequired: c.status === "Under Review" ? "Review Checklist" : "Approve Checklist",
        status: c.status,
        preparedBy: c.preparedByName,
        lastUpdated: c.lastModified,
      })),
    ];

    return respond(items);
  },

  getMyTasks(userName: string) {
    const activeDocs = documentsStore.filter((d) => !d.isArchived);
    const activeChecklists = checklistsStore.filter((c) => !c.isArchived);

    // List reviews or approvals where this person is assigned
    const items = [
      ...activeDocs
        .filter((d) => (d.reviewedByName === userName && d.status === "Under Review") || (d.approvedByName === userName && d.status === "Pending Approval"))
        .map((d) => ({
          id: d.id,
          type: "document" as const,
          description: d.description,
          identifier: d.policyNumber,
          role: d.reviewedByName === userName ? "Reviewer" : "Approver",
          actionRequired: d.status === "Under Review" ? "Document Review" : "Document Approval",
          status: d.status,
          preparedBy: d.preparedByName,
          lastUpdated: d.lastModified,
        })),
      ...activeChecklists
        .filter((c) => (c.reviewedByName === userName && c.status === "Under Review") || (c.approvedByName === userName && c.status === "Pending Approval"))
        .map((c) => ({
          id: c.id,
          type: "checklist" as const,
          description: c.description,
          identifier: c.formNumber,
          role: c.reviewedByName === userName ? "Reviewer" : "Approver",
          actionRequired: c.status === "Under Review" ? "Checklist Review" : "Checklist Approval",
          status: c.status,
          preparedBy: c.preparedByName,
          lastUpdated: c.lastModified,
        })),
    ];

    return respond(items);
  },
};
