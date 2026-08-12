import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/features/auth/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HEMP — Healthcare Engineering Management Platform" },
      {
        name: "description",
        content:
          "HEMP is an internal healthcare engineering management platform for clinical engineering teams.",
      },
      { property: "og:title", content: "HEMP — Healthcare Engineering Management Platform" },
      {
        property: "og:description",
        content: "Internal platform for healthcare engineering operations.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Index,
});

// No landing page: route straight into the app or the login screen.
function Index() {
  const { ready, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    navigate({ to: isAuthenticated ? "/app/dashboard" : "/login", replace: true });
  }, [ready, isAuthenticated, navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-muted">
      <Loading />
    </main>
  );
}
