export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="page-enter">
      {eyebrow && (
        <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      )}
    </header>
  );
}