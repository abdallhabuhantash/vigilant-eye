import { createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/common/Panel";
import { PageContainer } from "@/components/layout/PageContainer";
import { TopBar } from "@/components/layout/TopBar";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useSystemSettings, useUpdateSettings } from "@/hooks/use-monitoring";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "System Settings — Sentinel AI Exam Monitoring" },
      {
        name: "description",
        content: "AI service endpoints, retention policy and alerting preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useSystemSettings();
  const update = useUpdateSettings();
  const data = settings.data;
  return (
    <>
      <TopBar title="System Settings" subtitle="Administrator access" />
      <PageContainer>
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel
            title="Integration endpoints"
            subtitle="Point the prototype at the Python AI service or a future cloud backend."
            bodyClassName="space-y-3 p-3"
          >
            <Field label="AI service URL">
              <Input
                defaultValue={data?.aiServiceUrl ?? ""}
                onBlur={(event) => update.mutate({ aiServiceUrl: event.target.value })}
                className="h-8 font-mono text-xs"
              />
            </Field>
            <Field label="WebSocket URL">
              <Input
                defaultValue={data?.websocketUrl ?? ""}
                onBlur={(event) => update.mutate({ websocketUrl: event.target.value })}
                className="h-8 font-mono text-xs"
              />
            </Field>
            <Field label="Timezone">
              <Input
                defaultValue={data?.timezone ?? ""}
                onBlur={(event) => update.mutate({ timezone: event.target.value })}
                className="h-8 font-mono text-xs"
              />
            </Field>
          </Panel>
          <Panel title="Retention & alerting" bodyClassName="space-y-3 p-3">
            <Field label="Retention (days)">
              <Input
                type="number"
                defaultValue={data?.retentionDays ?? 0}
                onBlur={(event) => update.mutate({ retentionDays: Number(event.target.value) })}
                className="h-8 font-mono text-xs"
              />
            </Field>
            <Field label="Auto-acknowledge (minutes)">
              <Input
                type="number"
                defaultValue={data?.autoAcknowledgeMinutes ?? 0}
                onBlur={(event) =>
                  update.mutate({ autoAcknowledgeMinutes: Number(event.target.value) })
                }
                className="h-8 font-mono text-xs"
              />
            </Field>
            <div className="flex items-center justify-between rounded-[4px] border border-border/70 bg-surface-2/50 px-2.5 py-2">
              <span className="label-tech text-muted-foreground">Sound alerts</span>
              <Switch
                checked={data?.soundAlerts ?? false}
                onCheckedChange={(value) => update.mutate({ soundAlerts: value })}
              />
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              AI output is advisory only. All events are labelled as suspicious or possible activity
              and require human review before any action is taken.
            </p>
          </Panel>
        </div>
      </PageContainer>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="label-tech text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}