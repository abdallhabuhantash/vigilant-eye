import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CameraTile } from "@/components/common/CameraTile";
import { SeverityBadge, eventTypeLabel } from "@/components/common/EventBadges";
import { Panel } from "@/components/common/Panel";
import { PageContainer } from "@/components/layout/PageContainer";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { useCameraSummary, useCameras, useRecentEvents } from "@/hooks/use-monitoring";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/monitoring")({
  head: () => ({
    meta: [
      { title: "Live Monitoring — Sentinel AI Exam Monitoring" },
      {
        name: "description",
        content: "Multi-camera live video wall with AI detection overlays and real-time alerts.",
      },
    ],
  }),
  component: MonitoringPage,
});

type LayoutOption = 1 | 2 | 3 | 4;

const layoutClass: Record<LayoutOption, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-2 xl:grid-cols-4",
};

function MonitoringPage() {
  const cameras = useCameras();
  const fleet = useCameraSummary();
  const alerts = useRecentEvents(8);
  const [layout, setLayout] = useState<LayoutOption>(2);
  const [aiOnly, setAiOnly] = useState(false);
  const visible = (cameras.data ?? []).filter((camera) => !aiOnly || camera.aiEnabled);
  return (
    <>
      <TopBar
        title="Live Monitoring"
        subtitle={`${fleet.data?.online ?? 0} of ${fleet.data?.total ?? 0} streams online`}
      />
      <PageContainer>
        <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
          <Panel
            title="Video wall"
            subtitle="Detection overlays are rendered by the Python AI service"
            actions={
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={aiOnly ? "default" : "outline"}
                  className="h-7 px-2 text-[11px]"
                  onClick={() => setAiOnly((value) => !value)}
                >
                  AI only
                </Button>
                {([1, 2, 3, 4] as LayoutOption[]).map((option) => (
                  <Button
                    key={option}
                    size="sm"
                    variant={layout === option ? "default" : "outline"}
                    className="h-7 w-7 p-0 font-mono text-[11px]"
                    onClick={() => setLayout(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            }
          >
            <div className={cn("grid gap-3", layoutClass[layout])}>
              {visible.map((camera) => (
                <CameraTile key={camera.id} camera={camera} />
              ))}
            </div>
            {visible.length === 0 && (
              <p className="py-10 text-center text-xs text-muted-foreground">
                No cameras match the current filter.
              </p>
            )}
          </Panel>
          <Panel title="Live alert feed" bodyClassName="p-0">
            <ul className="divide-y divide-border/60">
              {(alerts.data ?? []).map((event) => (
                <li key={event.id} className="px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <SeverityBadge severity={event.severity} />
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatRelative(event.detectedAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-foreground">{eventTypeLabel[event.type]}</p>
                  <p className="text-[11px] text-muted-foreground">{event.cameraName}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </PageContainer>
    </>
  );
}