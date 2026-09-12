import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/hemp/brand";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loading";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/features/auth/auth-context";
import { DEMO_CREDENTIALS } from "@/features/auth/mock-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — HEMP Healthcare Engineering Management" },
      {
        name: "description",
        content:
          "Sign in to HEMP, the healthcare engineering management platform for clinical engineering operations.",
      },
      { property: "og:title", content: "Sign in — HEMP" },
      {
        property: "og:description",
        content: "Secure access to the HEMP healthcare engineering management platform.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

const DEMO_USERS = [
  {
    role: "Parts Admin",
    user: "Emeka Nwosu",
    username: "emekan",
    pass: "hemp1234",
    module: "Parts Inventory",
    description: "Full administrative control: Add/edit parts catalog, manage supplier pricing, approve physical audit shrinkage write-offs, and record stock movements.",
  },
  {
    role: "Parts User",
    user: "Khadija Umar",
    username: "khadijau",
    pass: "hemp1234",
    module: "Parts Inventory",
    description: "Technician access: View inventory levels & specs, browse stock movements, inspect locations, and enter physical audit counts (without sign-off permissions).",
  },
  {
    role: "Super Admin",
    user: "John Doe",
    username: "johndoe",
    pass: "hemp1234",
    module: "Global System",
    description: "Universal administrative access across all HEMP engineering modules.",
  },
  {
    role: "Tools Admin",
    user: "Sara Haddad",
    username: "sarah",
    pass: "hemp1234",
    module: "Tools & Equipment",
    description: "Tools registry management, calibration certificate reviews, and job dispatching.",
  },
  {
    role: "Tools User",
    user: "Marcus Vance",
    username: "marcusv",
    pass: "hemp1234",
    module: "Tools & Equipment",
    description: "Workbench specialist: Assigned jobs queue, test equipment checkouts, and expense claims.",
  },
  {
    role: "Quality Admin",
    user: "Liam Fischer",
    username: "liamf",
    pass: "hemp1234",
    module: "Quality & Governance",
    description: "Clinical policy document management, training matrix dispatching, and checklist reviews.",
  },
  {
    role: "Quality User",
    user: "Amara Okoye",
    username: "amarao",
    pass: "hemp1234",
    module: "Quality & Governance",
    description: "Clinical engineer: Policy document training, SOP compliance monitoring, and task execution.",
  },
  {
    role: "Financial Admin",
    user: "Ngozi Adeleke",
    username: "financeadmin",
    pass: "hemp1234",
    module: "Financial",
    description: "Financial management: Create/edit/archive purchase requisitions, approve orders, generate supplier POs, and view procurement KPIs.",
  },
  {
    role: "Financial User",
    user: "Tunde Bakare",
    username: "financeuser",
    pass: "hemp1234",
    module: "Financial",
    description: "Procurement engineer: Place orders for parts, service, or invoices, track order status and delivery receipts.",
  },
];

function LoginPage() {
  const { ready, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();

  const [selectedDemoUser, setSelectedDemoUser] = useState("emekan");
  const [username, setUsername] = useState("emekan");
  const [password, setPassword] = useState("hemp1234");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && isAuthenticated) navigate({ to: "/app", replace: true });
  }, [ready, isAuthenticated, navigate]);

  const handleSelectDemoUser = (val: string) => {
    setSelectedDemoUser(val);
    if (val === "custom") {
      setUsername("");
      setPassword("");
      return;
    }
    const match = DEMO_USERS.find((u) => u.username === val);
    if (match) {
      setUsername(match.username);
      setPassword(match.pass);
    }
  };

  if (!ready || isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-muted">
        <Loading />
      </main>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Enter your username and password to continue.");
      return;
    }

    setSubmitting(true);
    const result = await signIn({ username, password, remember });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate({ to: "/app", replace: true });
  }

  const currentDemo = DEMO_USERS.find((u) => u.username === username);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="page-enter w-full max-w-[25rem]">
        <div className="flex flex-col items-center text-center">
          <BrandMark className="size-10 rounded-lg" />
          <h1 className="mt-5 text-2xl font-semibold tracking-[0.22em] text-foreground">HEMP</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Healthcare Engineering
            <br />
            Management
          </p>
        </div>

        <div className="surface-panel mt-8 p-6 sm:p-7">
          <h2 className="text-base font-semibold text-foreground">Sign in to HEMP</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Select a mock persona or use workspace credentials.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Quick Demo User Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="demoUserSelect" className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Select Account / Persona</span>
                <span className="text-[10px] text-primary font-mono uppercase tracking-wider">Demo Quick Select</span>
              </Label>
              <select
                id="demoUserSelect"
                value={selectedDemoUser}
                onChange={(e) => handleSelectDemoUser(e.target.value)}
                className="flex h-10 w-full rounded-md border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                {DEMO_USERS.map((demo) => (
                  <option key={demo.username} value={demo.username}>
                    {demo.role}: {demo.user} (@{demo.username})
                  </option>
                ))}
                <option value="custom">— Enter Custom Credentials —</option>
              </select>
            </div>

            {currentDemo && (
              <div className="p-3 rounded-md bg-muted/40 border border-border/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground text-xs">{currentDemo.role}</span>
                    <span className="text-[11px] text-muted-foreground">({currentDemo.user})</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold border border-primary/20">
                    {currentDemo.module}
                  </span>
                </div>
                {currentDemo.description && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {currentDemo.description}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs">Username / Email</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setSelectedDemoUser("custom");
                }}
                aria-invalid={Boolean(error)}
                placeholder="johndoe"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setSelectedDemoUser("custom");
                }}
                aria-invalid={Boolean(error)}
                placeholder="••••••••"
                className="h-9 text-xs"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
              <Checkbox
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
              />
              Remember me on this browser
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs text-destructive"
              >
                {error}
              </p>
            )}

            <Button type="submit" className="w-full h-9 text-xs font-semibold" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}