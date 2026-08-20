import { configService } from "@/modules/settings/services/config-service";
import { respond } from "@/services/api/client";

const DEFAULT_CATEGORIES = [
  "Vital Signs Simulator",
  "Electrical Safety Analyzer",
  "Defibrillator Analyzer",
  "Gas Flow Analyzer",
  "NIBP Simulator",
  "Pressure Meter",
  "Electrosurgical Analyzer",
  "Photovoltaic Tester",
  "Infusion Pump Analyzer",
  "Ultrasound Wattmeter",
];

const DEFAULT_OEMS = [
  "Fluke Biomedical",
  "Rigel Medical",
  "Datrend Systems",
  "BC Biomedical",
  "Pronk Technologies",
  "Netech Corp",
  "IMT Analytics",
  "Gossen Metrawatt",
  "Seaward",
];

const DEFAULT_MODELS = [
  "Fluke ProSim 8",
  "Fluke ESA615",
  "Rigel Uni-Sim",
  "vPad-ES",
  "SA-2010",
  "SimCube SC-5",
  "Delta 3000",
  "FlowAnalyser PF-300",
  "QA-ES III",
  "Seculife ST PRO",
  "SafeTest 65",
  "PV200 Solar Analyzer",
];

const DEFAULT_WARRANTY_STATUSES = [
  "In Warranty",
  "Out of Warranty",
  "Extended Cover",
];

const DEFAULT_JOB_TYPES = [
  "Repair OOW",
  "Repair Warranty",
  "Calibration",
];

const DEFAULT_ROOT_CAUSES = [
  "Calibration due",
  "Software",
  "Power",
  "Physical damage",
  "User error",
];

const DEFAULT_EXPENSE_TYPES = [
  "Factory Calibration Service",
  "Replacement Parts",
  "Consumables",
  "Courier / Logistics",
  "OEM Service",
  "Diagnostics",
  "Labor",
];

const DEFAULT_DOCUMENT_TYPES = [
  "Calibration Certificate",
  "Decommissioning Certificate",
  "Purchase Order",
  "Service Report",
  "Warranty Document",
];

export const toolsSettingsService = {
  async getCategories(): Promise<string[]> {
    try {
      const records = await configService.list("tools.category");
      if (records && records.length > 0) {
        return records.filter((r) => r.status === "active").map((r) => r.label);
      }
    } catch {
      // fallback
    }
    return respond(DEFAULT_CATEGORIES);
  },

  async getOems(): Promise<string[]> {
    try {
      const records = await configService.list("tools.oem");
      if (records && records.length > 0) {
        return records.filter((r) => r.status === "active").map((r) => r.label);
      }
    } catch {
      // fallback
    }
    return respond(DEFAULT_OEMS);
  },

  async getModels(): Promise<string[]> {
    try {
      const records = await configService.list("tools.model");
      if (records && records.length > 0) {
        return records.filter((r) => r.status === "active").map((r) => r.label);
      }
    } catch {
      // fallback
    }
    return respond(DEFAULT_MODELS);
  },

  async getWarrantyStatuses(): Promise<string[]> {
    try {
      const records = await configService.list("tools.warranty-status");
      if (records && records.length > 0) {
        return records.filter((r) => r.status === "active").map((r) => r.label);
      }
    } catch {
      // fallback
    }
    return respond(DEFAULT_WARRANTY_STATUSES);
  },

  async getJobTypes(): Promise<string[]> {
    return respond(DEFAULT_JOB_TYPES);
  },

  async getRootCauses(): Promise<string[]> {
    return respond(DEFAULT_ROOT_CAUSES);
  },

  async getExpenseTypes(): Promise<string[]> {
    return respond(DEFAULT_EXPENSE_TYPES);
  },

  async getDocumentTypes(): Promise<string[]> {
    return respond(DEFAULT_DOCUMENT_TYPES);
  },
};
