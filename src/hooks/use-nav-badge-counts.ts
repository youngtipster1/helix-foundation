import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { qualityService } from "@/modules/quality/services/quality-service";
import { trainingService } from "@/modules/quality/services/training-service";
import { toolsJobService } from "@/modules/tools/services/tools-job-service";
import { toolsService } from "@/modules/tools/services/tools-service";
import { toolsExpenseService } from "@/modules/tools/services/tools-expense-service";
import { isModuleAdmin } from "@/features/auth/permissions";

export interface NavBadgeCounts {
  quality: {
    reviews: number;
    approvals: number;
    myTasks: number;
    training: number;
  };
  tools: {
    openJobs: number;
    calibrationAlerts: number;
    pendingExpenses: number;
    myJobs: number;
    myExpenses: number;
  };
  getBadgeCount: (to: string) => number | undefined;
}

export function useNavBadgeCounts(): NavBadgeCounts {
  const { user } = useAuth();

  const [qualityCounts, setQualityCounts] = useState({
    reviews: 0,
    approvals: 0,
    myTasks: 0,
    training: 0,
  });

  const [toolsCounts, setToolsCounts] = useState({
    openJobs: 0,
    calibrationAlerts: 0,
    pendingExpenses: 0,
    myJobs: 0,
    myExpenses: 0,
  });

  useEffect(() => {
    async function loadCounts() {
      if (!user) return;
      try {
        const fullName = `${user.firstName} ${user.lastName}`;
        const [qualityData, allTrainings] = await Promise.all([
          qualityService.getNavBadgeCounts(fullName, user.role),
          trainingService.list(),
        ]);

        const isQualAdmin = isModuleAdmin(user, "quality");
        const pendingTrainings = allTrainings.filter((t) => t.trainingStatus !== "Completed");
        const myPendingTrainings = pendingTrainings.filter(
          (t) =>
            t.assignedToId === user.id ||
            (fullName && t.assignedToName.toLowerCase().includes(fullName.toLowerCase())),
        );

        setQualityCounts({
          ...qualityData,
          training: isQualAdmin ? pendingTrainings.length : myPendingTrainings.length,
        });

        const [allJobs, allTools, allExpenses] = await Promise.all([
          toolsJobService.list(),
          toolsService.list(),
          toolsExpenseService.list(),
        ]);

        const openJobs = allJobs.filter((j) => j.jobStatus !== "Completed");
        const calAlerts = allTools.filter(
          (t) => t.calibrationStatus === "due_soon" || t.calibrationStatus === "expired",
        );
        const pendingExps = allExpenses.filter((e) => e.approvalStatus === "Pending Approval");

        const userId = user.id || "";
        const userNameLower = fullName.toLowerCase();
        const myOpenJobs = openJobs.filter(
          (j) =>
            j.assignedToId === userId ||
            (userNameLower && j.assignedToName.toLowerCase().includes(userNameLower)) ||
            (user.role?.includes("User") && (j.assignedToName.includes("Marcus") || j.assignedToName.includes("Amara"))),
        );

        const myPendingExps = pendingExps.filter(
          (e) =>
            e.submittedById === userId ||
            (userNameLower && e.submittedByName.toLowerCase().includes(userNameLower)) ||
            (user.role?.includes("User") && (e.submittedByName.includes("Marcus") || e.submittedByName.includes("Amara"))),
        );

        setToolsCounts({
          openJobs: openJobs.length,
          calibrationAlerts: calAlerts.length,
          pendingExpenses: pendingExps.length,
          myJobs: myOpenJobs.length,
          myExpenses: myPendingExps.length,
        });
      } catch (err) {
        console.error("Error loading nav badge counts", err);
      }
    }

    loadCounts();
    const interval = setInterval(loadCounts, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const getBadgeCount = (to: string): number | undefined => {
    // Quality
    if (to === "/app/quality/reviews") return qualityCounts.reviews || undefined;
    if (to === "/app/quality/approvals") return qualityCounts.approvals || undefined;
    if (to === "/app/quality/my-tasks") return qualityCounts.myTasks || undefined;
    if (to === "/app/quality/training") return qualityCounts.training || undefined;

    // Tools
    if (to === "/app/tools") return toolsCounts.calibrationAlerts || undefined;
    if (to === "/app/tools/jobs/open") return toolsCounts.openJobs || undefined;
    if (to === "/app/tools/expense-approvals") return toolsCounts.pendingExpenses || undefined;
    if (to === "/app/tools/my-jobs") return toolsCounts.myJobs || undefined;
    if (to === "/app/tools/my-expenses") return toolsCounts.myExpenses || undefined;

    return undefined;
  };

  return {
    quality: qualityCounts,
    tools: toolsCounts,
    getBadgeCount,
  };
}
