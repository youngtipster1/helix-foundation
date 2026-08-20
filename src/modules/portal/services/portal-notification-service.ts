import { qualityService } from "@/modules/quality/services/quality-service";
import { toolsJobService } from "@/modules/tools/services/tools-job-service";
import type { User } from "@/features/auth/types";

export interface ModuleNotificationSummary {
  qualityCount: number;
  debriefCount: number;
  settingsCount: number;
  financialsCount: number;
  toolsCount: number;
  assetsCount: number;
  partsInventoryCount: number;
  managementCount: number;
  kpiCount: number;
  totalAttentionRequired: number;
}

export const portalNotificationService = {
  async getNotificationsForUser(user: User | null): Promise<ModuleNotificationSummary> {
    if (!user) {
      return {
        qualityCount: 0,
        debriefCount: 0,
        settingsCount: 0,
        financialsCount: 0,
        toolsCount: 0,
        assetsCount: 0,
        partsInventoryCount: 0,
        managementCount: 0,
        kpiCount: 0,
        totalAttentionRequired: 0,
      };
    }

    const fullName = `${user.firstName} ${user.lastName}`.trim();
    let qualityCount = 0;
    let toolsCount = 0;

    try {
      const counts = await qualityService.getNavBadgeCounts(fullName, user.role);
      if (user.role === "Quality Admin" || user.isSuperAdmin || user.permissions?.quality === "admin") {
        qualityCount = (counts.reviews || 0) + (counts.approvals || 0);
      } else {
        qualityCount = counts.myTasks || 0;
      }
    } catch (err) {
      console.error("Error computing quality count for portal:", err);
      qualityCount = 0;
    }

    try {
      const openJobs = await toolsJobService.list("open");
      toolsCount = openJobs.length;
    } catch (err) {
      console.error("Error computing tools count for portal:", err);
      toolsCount = 0;
    }

    const settingsCount = 0;
    const debriefCount = 0;
    const partsInventoryCount = 0;
    const managementCount = 0;
    const financialsCount = 0;
    const assetsCount = 0;
    const kpiCount = 0;

    const totalAttentionRequired = qualityCount + toolsCount + settingsCount;

    return {
      qualityCount,
      debriefCount,
      settingsCount,
      financialsCount,
      toolsCount,
      assetsCount,
      partsInventoryCount,
      managementCount,
      kpiCount,
      totalAttentionRequired,
    };
  },
};
