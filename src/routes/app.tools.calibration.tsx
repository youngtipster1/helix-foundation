import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/tools/calibration")({
  beforeLoad: () => {
    throw redirect({ to: "/app/tools" });
  },
  component: () => null,
});
