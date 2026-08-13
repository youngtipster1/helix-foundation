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

function LoginPage() {
  const { ready, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && isAuthenticated) navigate({ to: "/app", replace: true });
  }, [ready, isAuthenticated, navigate]);

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
          <p className="mt-1 text-sm text-muted-foreground">
            Use your workspace credentials to continue.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="username">Username / Email</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                aria-invalid={Boolean(error)}
                placeholder="johndoe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(error)}
                placeholder="••••••••"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
              />
              Remember me
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>

        <div className="mt-6 border border-border bg-card/40 rounded-lg p-4 text-xs">
          <p className="font-semibold text-center text-muted-foreground mb-3">Quick Demo Logins</p>
          <div className="space-y-2">
            {[
              { role: "Super Admin", user: "John Doe", username: "johndoe", pass: "hemp1234" },
              { role: "Quality Admin", user: "Liam Fischer", username: "liamf", pass: "hemp1234" },
              { role: "Quality User", user: "Amara Okoye", username: "amarao", pass: "hemp1234" }
            ].map((demo) => (
              <button
                key={demo.role}
                type="button"
                onClick={() => {
                  setUsername(demo.username);
                  setPassword(demo.pass);
                }}
                className="w-full text-left flex items-center justify-between p-2.5 rounded border border-border/80 hover:bg-accent/40 hover:border-border transition-colors cursor-pointer select-none"
              >
                <div>
                  <span className="font-bold text-foreground block text-[11px]">{demo.role}</span>
                  <span className="text-[10px] text-muted-foreground">{demo.user} (@{demo.username})</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground font-semibold bg-muted/65 px-1.5 py-0.5 rounded">
                  {demo.pass}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}