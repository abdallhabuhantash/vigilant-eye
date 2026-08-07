import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Panel } from "@/components/common/Panel";
import { PageContainer } from "@/components/layout/PageContainer";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useSystemSettings, useUpdateSettings } from "@/hooks/use-monitoring";
import { requireAdministrator } from "@/lib/require-admin";

export const Route = createFileRoute("/_authenticated/settings")({
  beforeLoad: requireAdministrator,
  head: () => ({
    meta: [
      { title: "System Settings — Vigilant Eye AI Smart Surveillance" },
      {
        name: "description",
        content: "AI service endpoints, retention policy and alerting preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

/** Endpoint validation: only absolute URLs with the expected scheme are accepted. */
function validateUrl(value: string, schemes: string[], optional = true): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return optional ? null : "This endpoint is required";
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return `Enter a full URL, e.g. ${schemes[0]}://192.168.1.50:8000`;
  }
  if (!schemes.includes(parsed.protocol.replace(":", "")))
    return `URL must start with ${schemes.map((scheme) => `${scheme}://`).join(" or ")}`;
  return null;
}

function validateTimezone(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return "Timezone is required";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: trimmed });
    return null;
  } catch {
    return "Enter a valid IANA timezone, e.g. Asia/Amman";
  }
}

function SettingsPage() {
  const settings = useSystemSettings();
  const update = useUpdateSettings();
  const data = settings.data;

  // Endpoint and retention edits are drafts until explicitly saved.
  const [draft, setDraft] = useState({
    aiServiceUrl: "",
    websocketUrl: "",
    timezone: "",
    retentionDays: "30",
    autoAcknowledgeMinutes: "30",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setDraft({
      aiServiceUrl: data.aiServiceUrl,
      websocketUrl: data.websocketUrl,
      timezone: data.timezone,
      retentionDays: String(data.retentionDays),
      autoAcknowledgeMinutes: String(data.autoAcknowledgeMinutes),
    });
  }, [data]);

  const set = (key: keyof typeof draft, value: string) => {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const dirty =
    data !== undefined &&
    (draft.aiServiceUrl !== data.aiServiceUrl ||
      draft.websocketUrl !== data.websocketUrl ||
      draft.timezone !== data.timezone ||
      draft.retentionDays !== String(data.retentionDays) ||
      draft.autoAcknowledgeMinutes !== String(data.autoAcknowledgeMinutes));

  const save = () => {
    const next: Record<string, string> = {};
    const aiError = validateUrl(draft.aiServiceUrl, ["http", "https"]);
    if (aiError) next["aiServiceUrl"] = aiError;
    const wsError = validateUrl(draft.websocketUrl, ["ws", "wss"]);
    if (wsError) next["websocketUrl"] = wsError;
    const tzError = validateTimezone(draft.timezone);
    if (tzError) next["timezone"] = tzError;
    const retention = Number(draft.retentionDays);
    if (!Number.isInteger(retention) || retention < 1 || retention > 3650)
      next["retentionDays"] = "Retention must be between 1 and 3650 days";
    const ack = Number(draft.autoAcknowledgeMinutes);
    if (!Number.isInteger(ack) || ack < 0 || ack > 1440)
      next["autoAcknowledgeMinutes"] = "Auto-acknowledge must be between 0 and 1440 minutes";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    update.mutate(
      {
        aiServiceUrl: draft.aiServiceUrl.trim(),
        websocketUrl: draft.websocketUrl.trim(),
        timezone: draft.timezone.trim(),
        retentionDays: retention,
        autoAcknowledgeMinutes: ack,
      },
      { onSuccess: () => setSaved(true) },
    );
  };

  const reset = () => {
    if (!data) return;
    setErrors({});
    setSaved(false);
    setDraft({
      aiServiceUrl: data.aiServiceUrl,
      websocketUrl: data.websocketUrl,
      timezone: data.timezone,
      retentionDays: String(data.retentionDays),
      autoAcknowledgeMinutes: String(data.autoAcknowledgeMinutes),
    });
  };

  return (
    <>
      <TopBar title="System Settings" subtitle="Administrator access" />
      <PageContainer>
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel
            title="Operation mode"
            subtitle="Controls whether the console may display demonstration data."
            bodyClassName="space-y-3 p-3 lg:col-span-2"
          >
            <div className="flex items-center justify-between rounded-[4px] border border-border/70 bg-surface-2/50 px-2.5 py-2">
              <div>
                <span className="label-tech text-muted-foreground">Live mode</span>
                <p className="text-[11px] text-muted-foreground">
                  Live mode hides all demonstration cameras, placeholder services and sample events.
                  Only real hardware reporting a recent heartbeat is shown.
                </p>
              </div>
              <Switch
                checked={data?.operationMode === "live"}
                onCheckedChange={(value) =>
                  update.mutate({ operationMode: value ? "live" : "demo" })
                }
              />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-primary">
              current mode: {data?.operationMode ?? "—"}
            </p>
          </Panel>
          <Panel
            title="Integration endpoints"
            subtitle="Point the prototype at the Python AI service or a future cloud backend."
            bodyClassName="space-y-3 p-3"
          >
            <Field label="AI service URL" error={errors["aiServiceUrl"]}>
              <Input
                value={draft.aiServiceUrl}
                onChange={(event) => set("aiServiceUrl", event.target.value)}
                placeholder="http://192.168.1.50:8000"
                className="h-8 font-mono text-xs"
              />
            </Field>
            <Field label="WebSocket URL" error={errors["websocketUrl"]}>
              <Input
                value={draft.websocketUrl}
                onChange={(event) => set("websocketUrl", event.target.value)}
                placeholder="ws://192.168.1.50:8000/ws"
                className="h-8 font-mono text-xs"
              />
            </Field>
            <Field label="Timezone" error={errors["timezone"]}>
              <Input
                value={draft.timezone}
                onChange={(event) => set("timezone", event.target.value)}
                placeholder="Asia/Amman"
                className="h-8 font-mono text-xs"
              />
            </Field>
          </Panel>
          <Panel title="Retention & alerting" bodyClassName="space-y-3 p-3">
            <Field label="Retention (days)" error={errors["retentionDays"]}>
              <Input
                type="number"
                value={draft.retentionDays}
                onChange={(event) => set("retentionDays", event.target.value)}
                className="h-8 font-mono text-xs"
              />
            </Field>
            <Field label="Auto-acknowledge (minutes)" error={errors["autoAcknowledgeMinutes"]}>
              <Input
                type="number"
                value={draft.autoAcknowledgeMinutes}
                onChange={(event) => set("autoAcknowledgeMinutes", event.target.value)}
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
          <div className="flex items-center justify-end gap-2 lg:col-span-2">
            {saved && !dirty && (
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-success">
                Settings saved
              </span>
            )}
            {dirty && (
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-warning">
                Unsaved changes
              </span>
            )}
            <Button size="sm" variant="outline" onClick={reset} disabled={!dirty}>
              Discard
            </Button>
            <Button size="sm" onClick={save} disabled={!dirty || update.isPending}>
              {update.isPending ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </div>
      </PageContainer>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="label-tech text-muted-foreground">{label}</span>
      {children}
      {error && <span className="block text-[10px] text-destructive">{error}</span>}
    </label>
  );
}