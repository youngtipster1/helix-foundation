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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 max-w-2xl text-xs text-muted-foreground">{subtitle}</p>
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