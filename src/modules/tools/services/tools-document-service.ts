import { MOCK_DOCUMENTS } from "../mocks/documents-data";
import type { ToolDocument, UploadDocumentInput } from "../types";
import { respond, today } from "@/services/api/client";

let documentsStore: ToolDocument[] = [...MOCK_DOCUMENTS];
let nextDocSeq = 6;

export const toolsDocumentService = {
  async list(): Promise<ToolDocument[]> {
    return respond([...documentsStore]);
  },

  async listByToolId(toolId: string): Promise<ToolDocument[]> {
    const list = documentsStore.filter((d) => d.toolId === toolId);
    return respond(list);
  },

  async listByJobId(jobId: string): Promise<ToolDocument[]> {
    const list = documentsStore.filter((d) => d.jobId === jobId);
    return respond(list);
  },

  async upload(
    input: UploadDocumentInput,
    user: { id: string; name: string },
  ): Promise<ToolDocument> {
    const id = `DOC-${nextDocSeq.toString().padStart(4, "0")}`;
    nextDocSeq++;

    const newDoc: ToolDocument = {
      id,
      toolId: input.toolId,
      jobId: input.jobId,
      documentType: input.documentType,
      fileName: input.fileName,
      fileSize: input.fileSize || "1.5 MB",
      comment: input.comment,
      uploadedById: user.id,
      uploadedByName: user.name,
      dateUploaded: today(),
    };

    documentsStore = [newDoc, ...documentsStore];
    return respond(newDoc);
  },

  async delete(id: string): Promise<boolean> {
    documentsStore = documentsStore.filter((d) => d.id !== id);
    return respond(true);
  },
};
