import type { LucideIcon } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-enter mb-6">
      {eyebrow && (
        <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase mb-1">
          {eyebrow}
        </p>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {Icon && <Icon className="size-6 text-primary" />}
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}