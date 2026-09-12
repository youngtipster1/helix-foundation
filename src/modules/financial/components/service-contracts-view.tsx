import React from "react";
import { FileText, Clock, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function ServiceContractsView() {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 shadow-2xs my-8 animate-fade-in">
      <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto ring-8 ring-primary/5">
        <FileText className="size-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
          <Clock className="size-3.5" />
          <span>Feature In Specification</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Service Contracts Module
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          Comprehensive biomedical service level agreements (SLAs), equipment warranty contracts, and third-party vendor maintenance coverage tracking will be available here once detailed contract specifications are finalized.
        </p>
      </div>

      <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
        <Link to="/app/financial/dashboard">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="size-3.5" />
            Back to Financial Dashboard
          </Button>
        </Link>
        <Link to="/app/financial/orders">
          <Button size="sm" className="gap-2 text-xs">
            <span>Manage Purchase Orders</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
