import { createFileRoute, redirect } from "@tanstack/react-router";
import { authService } from "@/services/auth-service";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sentinel — AI IP Camera Exam Monitoring" },
      {
        name: "description",
        content:
          "Command-center console for multi-camera AI monitoring and suspicious cheating activity detection.",
      },
      { property: "og:title", content: "Sentinel — AI IP Camera Exam Monitoring" },
      {
        property: "og:description",
        content:
          "Command-center console for multi-camera AI monitoring and suspicious cheating activity detection.",
      },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: authService.getSession() ? "/dashboard" : "/login" });
  },
  component: () => null,
});
