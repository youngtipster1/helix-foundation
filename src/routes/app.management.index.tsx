import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app/management/")({
  component: () => <Navigate to="/app/management/assets" replace />,
});
