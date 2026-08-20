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

  // --- Rejection & Review Workflows ---
  rejectChecklist(
    id: string,
    notes: string,
    recommendations?: string,
    additionalRecommendedItems?: ChecklistItem[],
    reviewerName: string = "Admin"
  ) {
    checklistsStore = checklistsStore.map((chk) => {
      if (chk.id !== id) return chk;
      return {
        ...chk,
        status: "Needs Revision",
        rejectionNotes: notes,
        rejectionRecommendations: recommendations || undefined,
        additionalRecommendedItems:
          additionalRecommendedItems && additionalRecommendedItems.length > 0
            ? additionalRecommendedItems
            : undefined,
        lastModified: today() + " 12:00",
      };
    });

    const chk = checklistsStore.find((c) => c.id === id);
    if (chk) {
      this.logActivity({
        description: `${reviewerName} requested revision for ${chk.description}: "${notes}"`,
        type: "review",
        user: reviewerName,
        targetName: chk.formNumber,
      });
    }

    return respond(chk);
  },

  approveChecklistDirect(id: string, approverName: string = "Admin") {
    checklistsStore = checklistsStore.map((chk) => {
      if (chk.id !== id) return chk;
      return {
        ...chk,
        status: "Approved",
        approvedByName: approverName,
        lastModified: today() + " 12:00",
      };
    });

    const chk = checklistsStore.find((c) => c.id === id);
    if (chk) {
      this.logActivity({
        description: `${approverName} approved checklist ${chk.description}`,
        type: "approval",
        user: approverName,
        targetName: chk.formNumber,
      });
    }

    return respond(chk);
  },

  resubmitChecklist(id: string, input: Partial<EquipmentChecklistInput>, userName: string) {
    checklistsStore = checklistsStore.map((chk) => {
      if (chk.id !== id) return chk;
      return {
        ...chk,
        ...input,
        status: "Pending Approval",
        lastModified: today() + " 12:00",
      };
    });

    const chk = checklistsStore.find((c) => c.id === id);
    if (chk) {
      this.logActivity({
        description: `${userName} resubmitted checklist ${chk.description} for approval`,
        type: "update",
        user: userName,
        targetName: chk.formNumber,
      });
    }

    return respond(chk);
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
        fileName: d.fileName,
        rawDocument: d,
      })),
      ...activeChecklists.map((c) => ({
        id: c.id,
        type: "checklist" as const,
        description: c.description,
        identifier: c.formNumber,
        actionRequired: c.status === "Under Review" ? "Review Checklist" : "Approve Checklist",
        status: c.status,
        preparedBy: c.preparedByName,
        assignedToName: c.assignedToName,
        lastUpdated: c.lastModified,
        fileName: c.fileName,
        checklistType: c.type,
        items: c.items,
        rejectionNotes: c.rejectionNotes,
        rejectionRecommendations: c.rejectionRecommendations,
        rawChecklist: c,
      })),
    ];

    return respond(items);
  },

  getMyTasks(userName: string) {
    const activeDocs = documentsStore.filter((d) => !d.isArchived);
    const activeChecklists = checklistsStore.filter((c) => !c.isArchived);

    // Unapproved documents assigned for review/approval or created by user
    const docTasks = activeDocs
      .filter((d) => {
        if (d.status === "Approved") return false;
        return (
          d.reviewedByName === userName ||
          d.approvedByName === userName ||
          d.preparedByName === userName
        );
      })
      .map((d) => ({
        id: d.id,
        type: "document" as const,
        description: d.description,
        identifier: d.policyNumber,
        role:
          d.preparedByName === userName
            ? "Creator"
            : d.reviewedByName === userName
              ? "Reviewer"
              : "Approver",
        actionRequired:
          d.status === "Under Review"
            ? "Document Review"
            : d.status === "Pending Approval"
              ? "Document Approval"
              : "Document Status",
        status: d.status,
        preparedBy: d.preparedByName,
        lastUpdated: d.lastModified,
        fileName: d.fileName,
        rawDocument: d,
      }));

    // Unapproved checklists created by, assigned to, or under review/revision for this user
    const chkTasks = activeChecklists
      .filter((c) => {
        if (c.status === "Approved") return false;
        return (
          c.preparedByName === userName ||
          c.assignedToName === userName ||
          c.reviewedByName === userName ||
          c.approvedByName === userName
        );
      })
      .map((c) => ({
        id: c.id,
        type: "checklist" as const,
        description: c.description,
        identifier: c.formNumber,
        role:
          c.status === "Needs Revision"
            ? "Author (Revision Needed)"
            : c.preparedByName === userName
              ? "Author"
              : c.assignedToName === userName
                ? "Assignee"
                : c.reviewedByName === userName
                  ? "Reviewer"
                  : "Approver",
        actionRequired:
          c.status === "Needs Revision"
            ? "Revise Checklist & Resubmit"
            : c.status === "Under Review"
              ? "Awaiting Admin Review"
              : c.status === "Pending Approval"
                ? "Awaiting Admin Sign-Off"
                : "Checklist Action",
        status: c.status,
        preparedBy: c.preparedByName,
        assignedToName: c.assignedToName,
        lastUpdated: c.lastModified,
        rejectionNotes: c.rejectionNotes,
        rejectionRecommendations: c.rejectionRecommendations,
        checklistType: c.type,
        fileName: c.fileName,
        items: c.items,
        rawChecklist: c,
      }));

    return respond([...chkTasks, ...docTasks]);
  },

  getNavBadgeCounts(userName?: string, role?: string) {
    const activeDocs = documentsStore.filter((d) => !d.isArchived);
    const activeChecklists = checklistsStore.filter((c) => !c.isArchived);

    if (role === "Quality Admin") {
      const reviewsCount =
        activeDocs.filter((d) => d.status === "Under Review").length +
        activeChecklists.filter((c) => c.status === "Under Review").length;

      const approvalsCount =
        activeDocs.filter((d) => d.status === "Pending Approval").length +
        activeChecklists.filter((c) => c.status === "Pending Approval").length;

      return respond({ reviews: reviewsCount, approvals: approvalsCount, myTasks: 0 });
    }

    // Quality User
    const userTasks = [...activeChecklists, ...activeDocs].filter((item) => {
      if (item.status === "Approved") return false;
      const isAuthorOrAssignee =
        item.preparedByName === userName ||
        ("assignedToName" in item && item.assignedToName === userName) ||
        item.reviewedByName === userName ||
        item.approvedByName === userName;
      return isAuthorOrAssignee;
    }).length;

    return respond({ reviews: 0, approvals: 0, myTasks: userTasks });
  },
};
