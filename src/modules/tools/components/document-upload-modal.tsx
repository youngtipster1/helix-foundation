import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toolsSettingsService } from "../services/tools-settings-service";
import type { DocumentType, UploadDocumentInput } from "../types";
import { FileUp, FileCheck } from "lucide-react";

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolId: string;
  jobId?: string;
  onSubmit: (input: UploadDocumentInput) => Promise<void>;
}

export function DocumentUploadModal({
  open,
  onOpenChange,
  toolId,
  jobId,
  onSubmit,
}: DocumentUploadModalProps) {
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [documentType, setDocumentType] = useState<DocumentType>("Calibration Certificate");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadDocTypes() {
      const types = await toolsSettingsService.getDocumentTypes();
      setDocumentTypes(types);
      if (types.length > 0) setDocumentType(types[0] as DocumentType);
    }
    loadDocTypes();
  }, []);

  useEffect(() => {
    if (open) {
      setFileName("");
      setFileSize("");
      setComment("");
    }
  }, [open]);

  const handleMockFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentType) return;

    setUploading(true);
    try {
      await onSubmit({
        toolId,
        jobId,
        documentType,
        fileName: fileName || `${documentType.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`,
        fileSize: fileSize || "2.1 MB",
        comment: comment.trim(),
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Error uploading document", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <FileCheck className="size-4 text-primary" />
            Upload Equipment Document
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Attach compliance certificate, calibration report, or decommissioning statement.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="docType" className="text-xs">Document Type *</Label>
            <select
              id="docType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              required
            >
              {documentTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Select Document File (PDF / DOC / JPG)</Label>
            <div className="border border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center gap-2 bg-muted/20">
              <FileUp className="size-5 text-muted-foreground" />
              <div className="text-xs">
                {fileName ? (
                  <p className="font-semibold text-foreground">
                    {fileName} <span className="text-muted-foreground font-normal">({fileSize || "2.1 MB"})</span>
                  </p>
                ) : (
                  <p className="text-muted-foreground">Click to browse or drag file here</p>
                )}
              </div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-xs font-medium hover:bg-accent transition-colors">
                  Browse Files
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleMockFileUpload}
                />
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="docComment" className="text-xs">Notes / Traceability Reference</Label>
            <Textarea
              id="docComment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. NIST / ISO 17025 accreditation certificate reference..."
              className="text-xs min-h-[60px]"
            />
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={uploading} className="text-xs">
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
