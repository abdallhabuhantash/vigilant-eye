import { createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/common/Panel";
import { StatTile } from "@/components/common/StatTile";
import { StatusDot } from "@/components/common/StatusDot";
import { PageContainer } from "@/components/layout/PageContainer";
import { TopBar } from "@/components/layout/TopBar";
import { Switch } from "@/components/ui/switch";
import { useCameraSummary, useCameras, useToggleCameraFlag } from "@/hooks/use-monitoring";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cameras")({
  head: () => ({
    meta: [
      { title: "Cameras — Sentinel AI Exam Monitoring" },
      {
        name: "description",
        content: "Configure IP cameras, AI analysis and recording per channel across the fleet.",
      },
    ],
  }),
  component: CamerasPage,
});

function CamerasPage() {
  const cameras = useCameras();
  const fleet = useCameraSummary();
  const toggle = useToggleCameraFlag();
  return (
    <>
      <TopBar title="Camera Management" subtitle="Administrator access" />
      <PageContainer>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label="Configured" value={fleet.data?.total ?? 0} />
          <StatTile label="Online" value={fleet.data?.online ?? 0} tone="success" />
          <StatTile label="Degraded" value={fleet.data?.degraded ?? 0} tone="warning" />
          <StatTile label="Offline" value={fleet.data?.offline ?? 0} tone="critical" />
          <StatTile label="AI enabled" value={fleet.data?.aiEnabled ?? 0} tone="primary" />
        </div>
        <Panel
          title="Camera channels"
          subtitle="RTSP credentials are stored server-side and never sent to the browser."
          bodyClassName="p-0"
        >
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border/70">
                <th className="label-tech px-3 py-2">Status</th>
                <th className="label-tech px-3 py-2">Name</th>
                <th className="label-tech px-3 py-2">Location</th>
                <th className="label-tech px-3 py-2">Host / CH</th>
                <th className="label-tech px-3 py-2">Stream</th>
                <th className="label-tech px-3 py-2">Heartbeat</th>
                <th className="label-tech px-3 py-2">AI</th>
                <th className="label-tech px-3 py-2">Recording</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(cameras.data ?? []).map((camera) => (
                <tr key={camera.id} className="hover:bg-surface-2/60">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <StatusDot
                        tone={
                          camera.status === "online"
                            ? "online"
                            : camera.status === "degraded"
                              ? "degraded"
                              : "offline"
                        }
                        pulse={camera.status === "online"}
                      />
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                        {camera.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    {camera.name}
                    {camera.isDemo && (
                      <span className="ml-2 rounded-[3px] border border-border px-1 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                        demo
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{camera.location}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                    {camera.host} · CH{String(camera.channel).padStart(2, "0")}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {camera.resolution} @ {camera.fps}fps
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                    {formatRelative(camera.lastHeartbeatAt)}
                  </td>
                  <td className="px-3 py-2">
                    <Switch
                      checked={camera.aiEnabled}
                      onCheckedChange={(value) =>
                        toggle.mutate({ id: camera.id, field: "aiEnabled", value })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Switch
                      checked={camera.recording}
                      onCheckedChange={(value) =>
                        toggle.mutate({ id: camera.id, field: "recording", value })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </PageContainer>
    </>
  );
}