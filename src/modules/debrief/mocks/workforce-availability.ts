export type AvailabilityStatus = "available" | "training" | "leave" | "off" | "busy";

export interface EngineerAvailability {
  id: string;
  personnelId: string;
  personnelName: string;
  date: string; // YYYY-MM-DD
  status: AvailabilityStatus;
  title: string;
  notes?: string;
}

export const MOCK_ENGINEER_AVAILABILITY: EngineerAvailability[] = [
  {
    id: "avail_001",
    personnelId: "per_001", // John Doe
    personnelName: "John Doe",
    date: "2026-09-15",
    status: "training",
    title: "Radiation Safety & CT Compliance Training",
    notes: "Mandatory QA certification seminar (09:00 - 16:00)",
  },
  {
    id: "avail_002",
    personnelId: "per_001", // John Doe
    personnelName: "John Doe",
    date: "2026-09-25",
    status: "leave",
    title: "Approved Annual Leave",
    notes: "Family leave approved by HR",
  },
  {
    id: "avail_003",
    personnelId: "per_002", // Amara Okoye
    personnelName: "Amara Okoye",
    date: "2026-09-18",
    status: "training",
    title: "Ultrasound Transducer Calibration Workshop",
    notes: "OEM training session at GE Medical Campus",
  },
  {
    id: "avail_004",
    personnelId: "per_002", // Amara Okoye
    personnelName: "Amara Okoye",
    date: "2026-09-24",
    status: "off",
    title: "Roster Off Day",
    notes: "Shift rotation compensation day",
  },
  {
    id: "avail_005",
    personnelId: "per_005", // Marcus Vance
    personnelName: "Marcus Vance",
    date: "2026-09-16",
    status: "training",
    title: "High-Voltage Generator Safety",
    notes: "Siemens & Philips diagnostic workshop",
  },
  {
    id: "avail_006",
    personnelId: "per_005", // Marcus Vance
    personnelName: "Marcus Vance",
    date: "2026-09-22",
    status: "leave",
    title: "Medical Sick Leave",
    notes: "Medical certificate lodged",
  },
  {
    id: "avail_007",
    personnelId: "per_013", // Zainab Sani
    personnelName: "Zainab Sani",
    date: "2026-09-19",
    status: "training",
    title: "MRI Cryogen Handling Safety",
    notes: "Advanced superconducting magnet seminar",
  },
  {
    id: "avail_008",
    personnelId: "per_013", // Zainab Sani
    personnelName: "Zainab Sani",
    date: "2026-09-30",
    status: "off",
    title: "Scheduled Rest Day",
    notes: "Monthly downtime rotation",
  },
];
