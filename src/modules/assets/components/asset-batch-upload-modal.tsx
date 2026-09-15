import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Download, CheckCircle2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { Asset } from "../types";

interface AssetBatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (assets: Array<Omit<Asset, "id" | "createdAt" | "updatedAt" | "isArchived">>) => void;
}

export const AssetBatchUploadModal: React.FC<AssetBatchUploadModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "EquipmentNumber,SerialNumber,OEM,Modality,Model,AssetType,Status,InstallationDate,WarrantyStatus,Customer,Location,Region\n" +
      "EQ-2026-101,SN-GE-991,GE Healthcare,CT Scanner,Revolution Apex,Fixed Asset,Up,2026-01-10,Warranty,Lagos University Teaching Hospital (LUTH),Radiology Suite A,South West\n" +
      "EQ-2026-102,SN-SIE-442,Siemens Healthineers,MRI Scanner,MAGNETOM Vida 3T,Fixed Asset,Up,2026-02-15,Warranty,National Hospital Abuja,MRI Wing Ground Floor,North Central\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "assets_batch_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSimulateUpload = () => {
    // Generate 3 realistic demo assets from template
    const simulatedBatch: Array<Omit<Asset, "id" | "createdAt" | "updatedAt" | "isArchived">> = [
      {
        equipmentNumber: `EQ-${new Date().getFullYear()}-${Math.floor(200 + Math.random() * 800)}`,
        serialNumber: `SN-IMP-${Math.floor(10000 + Math.random() * 90000)}`,
        oem: "GE Healthcare",
        modality: "Ultrasound",
        model: "Voluson E10 BT22",
        assetType: "Mobile / Portable",
        equipmentStatus: "Up",
        installationDate: new Date().toISOString().split("T")[0],
        warrantyStatus: "Warranty",
        warrantyStartDate: new Date().toISOString().split("T")[0],
        warrantyEndDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
        ppmSchedule: "Quarterly (every 90 days)",
        nextPpmDate: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
        swVersion: "v12.4",
        dicVersion: "DICOM 3.0",
        customer: "University College Hospital (UCH) Ibadan",
        region: "South West",
        location: "Obstetrics Wing, 2nd Floor",
        customerContact: "Prof. Temitope Ogundipe",
        email: "obgyn@uch-ibadan.org.ng",
        phoneNumber: "+234 802 345 6789",
        contractStatus: "Out of Contract",
        ownershipType: "Purchased / Owned",
        networkDiagrams: [],
      },
      {
        equipmentNumber: `EQ-${new Date().getFullYear()}-${Math.floor(200 + Math.random() * 800)}`,
        serialNumber: `SN-IMP-${Math.floor(10000 + Math.random() * 90000)}`,
        oem: "Siemens Healthineers",
        modality: "X-Ray / Fluoroscopy",
        model: "Multix Impact Floor-Mounted",
        assetType: "Fixed Asset",
        equipmentStatus: "Up",
        installationDate: new Date().toISOString().split("T")[0],
        warrantyStatus: "Warranty",
        warrantyStartDate: new Date().toISOString().split("T")[0],
        warrantyEndDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
        ppmSchedule: "Bi-Annual (every 180 days)",
        nextPpmDate: new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
        swVersion: "v5.2",
        dicVersion: "DICOM 3.0",
        customer: "Lagos University Teaching Hospital (LUTH)",
        region: "South West",
        location: "Emergency Trauma Radiology",
        customerContact: "Dr. Adeyemi Adeleke",
        email: "radiology@luth.gov.ng",
        phoneNumber: "+234 803 123 4567",
        contractStatus: "Out of Contract",
        ownershipType: "Purchased / Owned",
        networkDiagrams: [],
      },
    ];

    setFileName("biomedical_equipment_import.csv");
    setParsedRows(simulatedBatch);
    setError(null);
  };

  const handleConfirmImport = () => {
    if (parsedRows.length > 0) {
      onImport(parsedRows);
      onClose();
      setFileName(null);
      setParsedRows([]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Upload className="size-4 text-primary" /> Batch Import Equipment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-xs py-2">
          <p className="text-slate-500">
            Upload CSV or Excel files containing multiple medical devices to bulk register them into
            the inventory catalog.
          </p>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-emerald-600" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">CSV Template</div>
                <div className="text-[11px] text-slate-400">Pre-formatted columns</div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadTemplate}
              className="text-xs h-7 gap-1"
            >
              <Download className="size-3" /> Download Template
            </Button>
          </div>

          <div
            onClick={handleSimulateUpload}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors bg-slate-50/50 dark:bg-slate-800/20"
          >
            <Upload className="size-8 mx-auto text-slate-400 mb-2" />
            <div className="font-semibold text-slate-700 dark:text-slate-200">
              {fileName ? fileName : "Click to select or drop CSV file here"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports .csv, .xlsx up to 5MB
            </p>
          </div>

          {parsedRows.length > 0 && (
            <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>
                Successfully validated <strong>{parsedRows.length}</strong> equipment rows ready to import.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={parsedRows.length === 0}
            onClick={handleConfirmImport}
            className="text-xs h-8 bg-primary text-white"
          >
            Import {parsedRows.length} Assets
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
