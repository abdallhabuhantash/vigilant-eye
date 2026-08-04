import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { SeverityBadge } from "@/components/common/EventBadges";
import { Panel } from "@/components/common/Panel";
import { PageContainer } from "@/components/layout/PageContainer";
import { TopBar } from "@/components/layout/TopBar";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAiRules, useCameras, useUpdateRule } from "@/hooks/use-monitoring";

export const Route = createFileRoute("/_authenticated/ai-rules")({
  head: () => ({
    meta: [
      { title: "AI Detection Rules — Sentinel AI Exam Monitoring" },
      {
        name: "description",
        content:
          "Configure AI detection rules, confidence thresholds and trigger durations per camera.",
      },
    ],
  }),
  component: AiRulesPage,
});

function AiRulesPage() {
  const rules = useAiRules();
  const cameras = useCameras();
  const update = useUpdateRule();
  return (
    <>
      <TopBar
        title="AI Detection Rules"
        subtitle="Rule engine is modular — new use cases plug in without UI rewrites"
      />
      <PageContainer>
        <div className="grid gap-3 lg:grid-cols-2">
          {(rules.data ?? []).map((rule) => (
            <Panel
              key={rule.id}
              title={rule.name}
              subtitle={rule.description}
              actions={
                rule.available ? (
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(value) =>
                      update.mutate({ id: rule.id, patch: { enabled: value } })
                    }
                  />
                ) : (
                  <span className="label-tech flex items-center gap-1 text-muted-foreground">
                    <Lock className="size-3" /> Planned
                  </span>
                )
              }
              bodyClassName="space-y-4 p-3"
              className={rule.available ? "" : "opacity-60"}
            >
              <div className="flex items-center gap-2">
                <SeverityBadge severity={rule.severity} />
                <span className="label-tech text-muted-foreground">
                  {rule.cameraIds.length} camera{rule.cameraIds.length === 1 ? "" : "s"} of{" "}
                  {cameras.data?.length ?? 0}
                </span>
              </div>
              <RuleSlider
                label="Confidence threshold"
                value={Math.round(rule.confidenceThreshold * 100)}
                suffix="%"
                min={40}
                max={99}
                disabled={!rule.available}
                onCommit={(value) =>
                  update.mutate({ id: rule.id, patch: { confidenceThreshold: value / 100 } })
                }
              />
              <RuleSlider
                label="Minimum duration"
                value={rule.minDurationSeconds}
                suffix="s"
                min={1}
                max={30}
                disabled={!rule.available}
                onCommit={(value) =>
                  update.mutate({ id: rule.id, patch: { minDurationSeconds: value } })
                }
              />
              <RuleSlider
                label="Cooldown"
                value={rule.cooldownSeconds}
                suffix="s"
                min={0}
                max={300}
                step={10}
                disabled={!rule.available}
                onCommit={(value) =>
                  update.mutate({ id: rule.id, patch: { cooldownSeconds: value } })
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <ToggleRow
                  label="Save snapshot"
                  checked={rule.saveSnapshot}
                  disabled={!rule.available}
                  onChange={(value) =>
                    update.mutate({ id: rule.id, patch: { saveSnapshot: value } })
                  }
                />
                <ToggleRow
                  label="Sound alert"
                  checked={rule.soundNotification}
                  disabled={!rule.available}
                  onChange={(value) =>
                    update.mutate({ id: rule.id, patch: { soundNotification: value } })
                  }
                />
              </div>
            </Panel>
          ))}
        </div>
      </PageContainer>
    </>
  );
}

function RuleSlider({
  label,
  value,
  suffix,
  min,
  max,
  step = 1,
  disabled,
  onCommit,
}: {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  step?: number;
  disabled: boolean;
  onCommit: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="label-tech text-muted-foreground">{label}</span>
        <span className="font-mono text-[12px] tabular-nums text-primary">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueCommit={(next) => onCommit(next[0] ?? value)}
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-[4px] border border-border/70 bg-surface-2/50 px-2.5 py-2">
      <span className="label-tech text-muted-foreground">{label}</span>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}