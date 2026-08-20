import type { Personnel } from "../types";

export const MOCK_PERSONNEL: Personnel[] = [
  {
    id: "per_001",
    firstName: "John",
    lastName: "Doe",
    jobTitle: "Engineering Manager",
    department: "Clinical Engineering",
    email: "john.doe@hemp.local",
    status: "active",
  },
  {
    id: "per_002",
    firstName: "Amara",
    lastName: "Okoye",
    jobTitle: "Biomedical Engineer",
    department: "Clinical Engineering",
    email: "amara.okoye@hemp.local",
    status: "active",
  },
  {
    id: "per_003",
    firstName: "Liam",
    lastName: "Fischer",
    jobTitle: "Quality Officer",
    department: "Quality Assurance",
    email: "liam.fischer@hemp.local",
    status: "active",
  },
  {
    id: "per_004",
    firstName: "Sara",
    lastName: "Haddad",
    jobTitle: "Tools Custodian",
    department: "Workshop",
    email: "sara.haddad@hemp.local",
    status: "active",
  },
  {
    id: "per_005",
    firstName: "Marcus",
    lastName: "Vance",
    jobTitle: "Biomedical Equipment Specialist",
    department: "Workshop",
    email: "marcus.vance@hemp.local",
    status: "active",
  },
];
