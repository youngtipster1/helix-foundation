import { MOCK_EXPENSES } from "../mocks/expenses-data";
import type { ToolExpense, CreateExpenseInput } from "../types";
import { respond, today } from "@/services/api/client";

let expensesStore: ToolExpense[] = [...MOCK_EXPENSES];
let nextExpSeq = 8;

export const toolsExpenseService = {
  async list(): Promise<ToolExpense[]> {
    return respond([...expensesStore]);
  },

  async listByJobId(jobId: string): Promise<ToolExpense[]> {
    const list = expensesStore.filter((e) => e.jobId === jobId);
    return respond(list);
  },

  async create(
    input: CreateExpenseInput,
    user: { id: string; name: string; isAdmin: boolean },
  ): Promise<ToolExpense> {
    const id = `EXP-${nextExpSeq.toString().padStart(4, "0")}`;
    nextExpSeq++;

    // User-created expenses start as Pending Approval
    // Admin can also start as Pending Approval or Approved
    const newExpense: ToolExpense = {
      id,
      jobId: input.jobId,
      date: input.date || today(),
      expenseType: input.expenseType,
      amount: Number(input.amount),
      comment: input.comment,
      receiptFileName: input.receiptFileName || "Receipt_Attachment.pdf",
      receiptFileSize: input.receiptFileSize || "1.2 MB",
      approvalStatus: "Pending Approval",
      submittedById: user.id,
      submittedByName: user.name,
      submittedAt: today(),
    };

    expensesStore = [newExpense, ...expensesStore];
    return respond(newExpense);
  },

  async approve(id: string, reviewer: { id: string; name: string }): Promise<ToolExpense> {
    let updated: ToolExpense | undefined;
    expensesStore = expensesStore.map((e) => {
      if (e.id !== id) return e;
      updated = {
        ...e,
        approvalStatus: "Approved",
        reviewedById: reviewer.id,
        reviewedByName: reviewer.name,
        reviewedAt: today(),
        rejectionReason: undefined,
      };
      return updated;
    });

    if (!updated) throw new Error(`Expense ${id} not found`);
    return respond(updated);
  },

  async reject(
    id: string,
    reviewer: { id: string; name: string },
    rejectionReason: string,
  ): Promise<ToolExpense> {
    let updated: ToolExpense | undefined;
    expensesStore = expensesStore.map((e) => {
      if (e.id !== id) return e;
      updated = {
        ...e,
        approvalStatus: "Rejected",
        reviewedById: reviewer.id,
        reviewedByName: reviewer.name,
        reviewedAt: today(),
        rejectionReason,
      };
      return updated;
    });

    if (!updated) throw new Error(`Expense ${id} not found`);
    return respond(updated);
  },

  async getTotalByJobId(jobId: string): Promise<number> {
    const list = expensesStore.filter((e) => e.jobId === jobId);
    const total = list.reduce((sum, e) => sum + e.amount, 0);
    return respond(total);
  },
};
