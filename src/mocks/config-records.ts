import type { ConfigRecord } from "@/types";

/**
 * Minimal mock configuration data. Replace with Laravel API responses later —
 * nothing outside src/services/api reads this file.
 */
let seq = 0;
const record = (
  configKey: string,
  label: string,
  updatedAt: string,
  status: ConfigRecord["status"] = "active",
  description?: string,
): ConfigRecord => ({
  id: `cfg_${(++seq).toString().padStart(3, "0")}`,
  configKey,
  label,
  status,
  updatedAt,
  ...(description ? { description } : {}),
});

export const MOCK_CONFIG_RECORDS: ConfigRecord[] = [
  record("quality.names", "Preventive Maintenance Checklist", "2026-07-28"),
  record("quality.names", "Calibration Record", "2026-07-24"),
  record("quality.names", "Incident Report", "2026-06-30", "archived"),

  record("quality.document-status", "Draft", "2026-07-30"),
  record("quality.document-status", "Under Review", "2026-07-30"),
  record("quality.document-status", "Approved", "2026-07-30"),
  record("quality.document-status", "Archived", "2026-07-12", "archived"),

  record("quality.equipment-oem", "GE Healthcare", "2026-07-21"),
  record("quality.equipment-oem", "Siemens Healthineers", "2026-07-21"),
  record("quality.equipment-oem", "Philips", "2026-07-19"),

  record("quality.modality", "Radiography", "2026-07-18"),
  record("quality.modality", "Ultrasound", "2026-07-18"),
  record("quality.modality", "MRI", "2026-07-15"),
  record("quality.modality", "CT", "2026-07-15"),

  record("quality.equipment-model", "Optima XR240amx", "2026-07-11"),
  record("quality.equipment-model", "ACUSON Sequoia", "2026-07-11"),
  record("quality.equipment-model", "MAGNETOM Sola", "2026-07-05", "archived"),

  record("tools.warranty-status", "In Warranty", "2026-07-27"),
  record("tools.warranty-status", "Out of Warranty", "2026-07-27"),
  record("tools.warranty-status", "Extended Cover", "2026-07-02", "archived"),

  record("tools.model", "Fluke ProSim 8", "2026-07-22"),
  record("tools.model", "Fluke ESA615", "2026-07-22"),
  record("tools.model", "Rigel Uni-Sim", "2026-07-08"),

  record("tools.oem", "Fluke Biomedical", "2026-07-22"),
  record("tools.oem", "Rigel Medical", "2026-07-08"),
  record("tools.oem", "Datrend Systems", "2026-06-29"),
];
