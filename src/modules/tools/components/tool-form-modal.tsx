import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Stepper, type StepItem } from "@/components/ui/stepper";
import { toolsSettingsService } from "../services/tools-settings-service";
import type { Tool, ToolInput, WarrantyStatus } from "../types";
import { FileUp, Wrench, Shield, DollarSign, ChevronLeft, ChevronRight, Check } from "lucide-react";

interface ToolFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: Tool | null;
  onSubmit: (input: ToolInput) => Promise<void>;
}

const TOOL_STEPS: StepItem[] = [
  { id: "general", title: "Specifications", description: "Model & Serial", icon: Wrench },
  { id: "calibration", title: "Calibration & Warranty", description: "Dates & Schedule", icon: Shield },
  { id: "financials", title: "Vendor & Financials", description: "PO, Cost & Receipt", icon: DollarSign },
];

export function ToolFormModal({ open, onOpenChange, tool, onSubmit }: ToolFormModalProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);

  const stepIndex = activeTab === "general" ? 0 : activeTab === "calibration" ? 1 : 2;
  const setStepIndex = (idx: number) => {
    if (idx === 0) setActiveTab("general");
    if (idx === 1) setActiveTab("calibration");
    if (idx === 2) setActiveTab("financials");
  };

  // Settings options
  const [categories, setCategories] = useState<string[]>([]);
  const [oems, setOems] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [warrantyStatuses, setWarrantyStatuses] = useState<string[]>([]);

  // Form State
  const [serialNumber, setSerialNumber] = useState("");
  const [category, setCategory] = useState("");
  const [oem, setOem] = useState("");
  const [model, setModel] = useState("");
  const [yearOfManufacture, setYearOfManufacture] = useState<number>(new Date().getFullYear());

  const [vendor, setVendor] = useState("");
  const [vendorContact, setVendorContact] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");

  const [lastCalibrationDate, setLastCalibrationDate] = useState("");
  const [nextCalibrationDate, setNextCalibrationDate] = useState("");
  const [calibrationValidity, setCalibrationValidity] = useState("12 Months");
  const [calibrationStatus, setCalibrationStatus] = useState<"valid" | "due_soon" | "expired">("valid");
  const [warrantyStatus, setWarrantyStatus] = useState<WarrantyStatus>("In Warranty");
  const [warrantyStartDate, setWarrantyStartDate] = useState("");
  const [warrantyEndDate, setWarrantyEndDate] = useState("");

  const [dateOfPurchase, setDateOfPurchase] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [cost, setCost] = useState<string>("");
  const [comment, setComment] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [receiptFileSize, setReceiptFileSize] = useState("");

  useEffect(() => {
    async function loadSettings() {
      const [cats, oemList, mdlList, warrList] = await Promise.all([
        toolsSettingsService.getCategories(),
        toolsSettingsService.getOems(),
        toolsSettingsService.getModels(),
        toolsSettingsService.getWarrantyStatuses(),
      ]);
      setCategories(cats);
      setOems(oemList);
      setModels(mdlList);
      setWarrantyStatuses(warrList);
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (tool) {
      setSerialNumber(tool.serialNumber || "");
      setCategory(tool.category || "");
      setOem(tool.oem || "");
      setModel(tool.model || "");
      setYearOfManufacture(tool.yearOfManufacture || new Date().getFullYear());

      setVendor(tool.vendor || "");
      setVendorContact(tool.vendorContact || "");
      setVendorEmail(tool.vendorEmail || "");
      setVendorPhone(tool.vendorPhone || "");
      setVendorAddress(tool.vendorAddress || "");

      setLastCalibrationDate(tool.lastCalibrationDate || "");
      setNextCalibrationDate(tool.nextCalibrationDate || "");
      setCalibrationValidity(tool.calibrationValidity || "12 Months");
      setCalibrationStatus(tool.calibrationStatus || "valid");
      setWarrantyStatus(tool.warrantyStatus || "In Warranty");
      setWarrantyStartDate(tool.warrantyStartDate || "");
      setWarrantyEndDate(tool.warrantyEndDate || "");

      setDateOfPurchase(tool.dateOfPurchase || "");
      setPoNumber(tool.poNumber || "");
      setCost(tool.cost ? tool.cost.toString() : "");
      setComment(tool.comment || "");
      setReceiptFileName(tool.receiptFileName || "");
      setReceiptFileSize(tool.receiptFileSize || "");
    } else {
      setSerialNumber("");
      setCategory(categories[0] || "Vital Signs Simulator");
      setOem(oems[0] || "Fluke Biomedical");
      setModel(models[0] || "Fluke ProSim 8");
      setYearOfManufacture(new Date().getFullYear());

      setVendor("Fluke Biomedical Direct");
      setVendorContact("Mark Reynolds");
      setVendorEmail("m.reynolds@flukebiomedical.com");
      setVendorPhone("+1 (800) 850-4608");
      setVendorAddress("6920 Seaway Blvd, Everett, WA 98203, USA");

      const todayIso = new Date().toISOString().slice(0, 10);
      const nextYearIso = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setLastCalibrationDate(todayIso);
      setNextCalibrationDate(nextYearIso);
      setCalibrationValidity("12 Months");
      setCalibrationStatus("valid");
      setWarrantyStatus("In Warranty");
      setWarrantyStartDate(todayIso);
      setWarrantyEndDate(nextYearIso);

      setDateOfPurchase(todayIso);
      setPoNumber(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setCost("4500000");
      setComment("");
      setReceiptFileName("");
      setReceiptFileSize("");
    }
    setActiveTab("general");
  }, [tool, open, categories, oems, models]);

  const handleMockFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFileName(file.name);
      setReceiptFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim() || !category || !oem || !model) return;

    setSaving(true);
    try {
      await onSubmit({
        id: tool?.id,
        serialNumber: serialNumber.trim(),
        category,
        oem,
        model,
        yearOfManufacture: Number(yearOfManufacture),
        lastCalibrationDate: lastCalibrationDate || new Date().toISOString().slice(0, 10),
        nextCalibrationDate: nextCalibrationDate || new Date().toISOString().slice(0, 10),
        calibrationValidity,
        calibrationStatus,
        warrantyStatus,
        warrantyStartDate: warrantyStartDate || new Date().toISOString().slice(0, 10),
        warrantyEndDate: warrantyEndDate || new Date().toISOString().slice(0, 10),
        vendor: vendor.trim(),
        vendorContact: vendorContact.trim(),
        vendorEmail: vendorEmail.trim(),
        vendorPhone: vendorPhone.trim(),
        vendorAddress: vendorAddress.trim(),
        dateOfPurchase: dateOfPurchase || new Date().toISOString().slice(0, 10),
        poNumber: poNumber.trim(),
        cost: Number(cost) || 0,
        comment: comment.trim(),
        receiptFileName: receiptFileName || (tool ? tool.receiptFileName : undefined),
        receiptFileSize: receiptFileSize || (tool ? tool.receiptFileSize : undefined),
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Error submitting tool form", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        className="max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden"
      >
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-card/50 space-y-3">
          <div>
            <DialogTitle className="text-base font-bold text-foreground sm:text-lg">
              {tool ? `Edit Tool — ${tool.id}` : "Add New Tool"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Register and manage physical test equipment, calibration validity, and procurement records.
            </p>
          </div>

          <Stepper
            steps={TOOL_STEPS}
            currentStep={stepIndex}
            onStepClick={setStepIndex}
          />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            {/* TAB 1: GENERAL */}
            <TabsContent value="general" className="space-y-4">
              <div className="border border-border/80 rounded-lg p-4 bg-muted/20 space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Equipment Master Specifications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs">Category *</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="oem" className="text-xs">OEM (Manufacturer) *</Label>
                    <select
                      id="oem"
                      value={oem}
                      onChange={(e) => setOem(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                      required
                    >
                      {oems.map((mfg) => (
                        <option key={mfg} value={mfg}>{mfg}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="model" className="text-xs">Model *</Label>
                    <Input
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. Fluke ProSim 8"
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="serialNumber" className="text-xs">Serial Number (S/N) *</Label>
                    <Input
                      id="serialNumber"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="SN-XXX-XXXXX"
                      className="h-9 text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="yearOfManufacture" className="text-xs">Year of Manufacture</Label>
                    <Input
                      id="yearOfManufacture"
                      type="number"
                      value={yearOfManufacture}
                      onChange={(e) => setYearOfManufacture(Number(e.target.value))}
                      className="h-9 text-xs font-mono"
                      min={1990}
                      max={2030}
                    />
                  </div>
                </div>
              </div>

              <div className="border border-border/80 rounded-lg p-4 bg-muted/20 space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Vendor & Service Contact Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="vendor" className="text-xs">Vendor Name</Label>
                    <Input
                      id="vendor"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      placeholder="Vendor Company Name"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="vendorContact" className="text-xs">Contact Person</Label>
                    <Input
                      id="vendorContact"
                      value={vendorContact}
                      onChange={(e) => setVendorContact(e.target.value)}
                      placeholder="Representative Name"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="vendorEmail" className="text-xs">Vendor Email</Label>
                    <Input
                      id="vendorEmail"
                      type="email"
                      value={vendorEmail}
                      onChange={(e) => setVendorEmail(e.target.value)}
                      placeholder="service@vendor.com"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="vendorPhone" className="text-xs">Vendor Phone</Label>
                    <Input
                      id="vendorPhone"
                      value={vendorPhone}
                      onChange={(e) => setVendorPhone(e.target.value)}
                      placeholder="+1 (800) 000-0000"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="vendorAddress" className="text-xs">Vendor Address</Label>
                    <Input
                      id="vendorAddress"
                      value={vendorAddress}
                      onChange={(e) => setVendorAddress(e.target.value)}
                      placeholder="Full facility address"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: CALIBRATION & WARRANTY */}
            <TabsContent value="calibration" className="space-y-4">
              <div className="border border-border/80 rounded-lg p-4 bg-muted/20 space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Calibration Schedule & Status
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="lastCalibrationDate" className="text-xs">Last Calibration Date</Label>
                    <Input
                      id="lastCalibrationDate"
                      type="date"
                      value={lastCalibrationDate}
                      onChange={(e) => setLastCalibrationDate(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="nextCalibrationDate" className="text-xs">Next Calibration Date *</Label>
                    <Input
                      id="nextCalibrationDate"
                      type="date"
                      value={nextCalibrationDate}
                      onChange={(e) => setNextCalibrationDate(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="calibrationValidity" className="text-xs">Calibration Interval</Label>
                    <select
                      id="calibrationValidity"
                      value={calibrationValidity}
                      onChange={(e) => setCalibrationValidity(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                    >
                      <option value="6 Months">6 Months</option>
                      <option value="12 Months">12 Months</option>
                      <option value="24 Months">24 Months</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="calibrationStatus" className="text-xs">Calibration Status *</Label>
                    <select
                      id="calibrationStatus"
                      value={calibrationStatus}
                      onChange={(e) => setCalibrationStatus(e.target.value as "valid" | "due_soon" | "expired")}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer font-medium"
                    >
                      <option value="valid">Valid / Calibrated (Green)</option>
                      <option value="due_soon">Due for Calibration (Yellow)</option>
                      <option value="expired">Out of Calibration (Red)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border border-border/80 rounded-lg p-4 bg-muted/20 space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Warranty Coverage
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="warrantyStatus" className="text-xs">Warranty Status</Label>
                    <select
                      id="warrantyStatus"
                      value={warrantyStatus}
                      onChange={(e) => setWarrantyStatus(e.target.value as WarrantyStatus)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                    >
                      {warrantyStatuses.map((ws) => (
                        <option key={ws} value={ws}>{ws}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="warrantyStartDate" className="text-xs">Warranty Start Date</Label>
                    <Input
                      id="warrantyStartDate"
                      type="date"
                      value={warrantyStartDate}
                      onChange={(e) => setWarrantyStartDate(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="warrantyEndDate" className="text-xs">Warranty End Date</Label>
                    <Input
                      id="warrantyEndDate"
                      type="date"
                      value={warrantyEndDate}
                      onChange={(e) => setWarrantyEndDate(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: FINANCIALS */}
            <TabsContent value="financials" className="space-y-4">
              <div className="border border-border/80 rounded-lg p-4 bg-muted/20 space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Procurement & Financial Records
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="finVendor" className="text-xs">Vendor / Supplier</Label>
                    <Input
                      id="finVendor"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      placeholder="Vendor / Supplier Company Name"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="poNumber" className="text-xs">PO Number</Label>
                    <Input
                      id="poNumber"
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      placeholder="PO-YYYY-XXXX"
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dateOfPurchase" className="text-xs">Date of Purchase</Label>
                    <Input
                      id="dateOfPurchase"
                      type="date"
                      value={dateOfPurchase}
                      onChange={(e) => setDateOfPurchase(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cost" className="text-xs">Purchase Cost (₦ NGN)</Label>
                    <Input
                      id="cost"
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="4500000"
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comment" className="text-xs">Comments & Asset Notes</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Provide additional operational context or notes regarding this tool..."
                    className="text-xs min-h-[70px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Receipt / Purchase Order Document</Label>
                  <div className="border border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center gap-2 bg-background">
                    <FileUp className="size-5 text-muted-foreground" />
                    <div className="text-xs">
                      {receiptFileName ? (
                        <p className="font-semibold text-foreground">
                          {receiptFileName} <span className="text-muted-foreground font-normal">({receiptFileSize || "1.5 MB"})</span>
                        </p>
                      ) : (
                        <p className="text-muted-foreground">Attach Purchase Order or invoice receipt (PDF / PNG / JPG)</p>
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center justify-center rounded-md border border-input bg-muted/60 px-3 py-1 text-xs font-medium hover:bg-muted transition-colors">
                        Browse File
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleMockFileUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-3.5 sm:p-4 border-t border-border bg-card/60 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStepIndex(stepIndex - 1)}
                className="text-xs gap-1"
              >
                <ChevronLeft className="size-3.5" />
                <span>Back</span>
              </Button>
            )}

            {stepIndex < 2 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setStepIndex(stepIndex + 1)}
                className="text-xs gap-1"
              >
                <span>Continue</span>
                <ChevronRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={saving || !serialNumber.trim()}
                className="text-xs gap-1.5"
              >
                <Check className="size-3.5" />
                <span>{saving ? "Saving..." : tool ? "Save Changes" : "Register Tool"}</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </form>
    </DialogContent>
    </Dialog>
  );
}
