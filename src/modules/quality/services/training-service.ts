import { MOCK_TRAINING_ASSIGNMENTS } from "../mocks/training-data";
import type { TrainingAssignment, AssignTrainingInput, UserComplianceKPI } from "../types";
import { respond, today } from "@/services/api/client";
import { qualityService } from "./quality-service";

let trainingStore: TrainingAssignment[] = [...MOCK_TRAINING_ASSIGNMENTS];
let nextSeq = 11;

export const trainingService = {
  async list(): Promise<TrainingAssignment[]> {
    return respond([...trainingStore]);
  },

  async listByUser(userId: string, userName?: string): Promise<TrainingAssignment[]> {
    const nameLower = userName?.toLowerCase() || "";
    const list = trainingStore.filter(
      (t) =>
        t.assignedToId === userId ||
        (nameLower && t.assignedToName.toLowerCase().includes(nameLower)) ||
        (nameLower.includes("marcus") && t.assignedToName.includes("Marcus")) ||
        (nameLower.includes("amara") && t.assignedToName.includes("Amara")) ||
        (nameLower.includes("sara") && t.assignedToName.includes("Sara")),
    );
    return respond(list.length > 0 ? list : trainingStore.slice(0, 3));
  },

  async assignTraining(
    input: AssignTrainingInput,
    assigner: { id: string; name: string },
    userMap: Record<string, string>, // id -> name
  ): Promise<TrainingAssignment[]> {
    const created: TrainingAssignment[] = [];

    for (const userId of input.userIds) {
      const id = `TRN-${nextSeq.toString().padStart(4, "0")}`;
      nextSeq++;

      const newAssignment: TrainingAssignment = {
        id,
        trainingType: input.trainingType,
        policyDocumentId: input.policyDocumentId,
        policyDocumentTitle: input.title,
        documentVersion: input.version || "v1.0",
        documentFileName: input.fileName,
        typedInstructions: input.typedInstructions,
        assignedDate: today(),
        trainingStatus: "Pending",
        assignedToId: userId,
        assignedToName: userMap[userId] || "Biomedical Engineer",
        assignedById: assigner.id,
        assignedByName: assigner.name,
        dueDate: input.dueDate || today(),
        summaryOrScope: input.notes || (input.trainingType === "typed_instructions" ? input.typedInstructions?.slice(0, 100) : "Mandatory SOP policy reading and compliance verification."),
      };

      trainingStore = [newAssignment, ...trainingStore];
      created.push(newAssignment);
    }

    return respond(created);
  },

  async acknowledgeTraining(
    id: string,
    user: { id: string; name: string },
    notes?: string,
  ): Promise<TrainingAssignment> {
    let updated: TrainingAssignment | undefined;

    trainingStore = trainingStore.map((t) => {
      if (t.id !== id) return t;
      updated = {
        ...t,
        trainingStatus: "Completed",
        completionDate: today(),
        acknowledgedAt: `${today()} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        acknowledgementNotes: notes || "Acknowledged and confirmed compliance.",
      };
      return updated;
    });

    if (!updated) throw new Error(`Training ${id} not found`);
    return respond(updated);
  },

  async getComplianceKPIs(): Promise<UserComplianceKPI[]> {
    const userGroups: Record<string, { assigned: number; completed: number; name: string }> = {};

    for (const item of trainingStore) {
      const name = item.assignedToName;
      if (!userGroups[name]) {
        userGroups[name] = { assigned: 0, completed: 0, name };
      }
      userGroups[name].assigned += 1;
      if (item.trainingStatus === "Completed") {
        userGroups[name].completed += 1;
      }
    }

    const kpis: UserComplianceKPI[] = Object.entries(userGroups).map(([name, data]) => {
      const rate = data.assigned > 0 ? Math.round((data.completed / data.assigned) * 100) : 0;
      return {
        userId: name,
        userName: name,
        assignedCount: data.assigned,
        completedCount: data.completed,
        complianceRate: rate,
        // Rule from slide: 100% is GREEN (#22c55e), less than 100% is RED (#ef4444)
        fillColor: rate >= 100 ? "#22c55e" : "#ef4444",
      };
    });

    return respond(kpis);
  },
};
