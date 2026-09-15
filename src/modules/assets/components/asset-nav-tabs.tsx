import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Layers, BarChart3, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssetNavTabsProps {
  className?: string;
}

export const AssetNavTabs: React.FC<AssetNavTabsProps> = ({ className }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const tabs = [
    {
      title: "Dashboard - Asset",
      to: "/app/assets/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/app/assets/dashboard" || pathname === "/app/assets",
    },
    {
      title: "Asset list",
      to: "/app/assets/list",
      icon: Layers,
      isActive: pathname === "/app/assets/list",
    },
    {
      title: "Dashboard - Service contracts",
      to: "/app/assets/contracts-dashboard",
      icon: BarChart3,
      isActive: pathname === "/app/assets/contracts-dashboard",
    },
    {
      title: "Service contracts list",
      to: "/app/assets/contracts",
      icon: FileText,
      isActive: pathname === "/app/assets/contracts",
    },
  ];

  return (
    <div className={cn("flex items-center overflow-x-auto no-scrollbar gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800 w-fit max-w-full", className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
              tab.isActive
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold border border-slate-200/60 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
            )}
          >
            <Icon className={cn("w-3.5 h-3.5", tab.isActive ? "text-primary" : "text-slate-400")} />
            <span>{tab.title}</span>
          </Link>
        );
      })}
    </div>
  );
};
