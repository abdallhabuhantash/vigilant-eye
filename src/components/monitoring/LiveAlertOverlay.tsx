import { AlertTriangle } from "lucide-react";
import { eventSubtitle, eventTitle, formatPercent, formatSeconds } from "@/lib/event-presentation";
import type { Camera, DetectionEvent } from "@/types";

export function LiveAlertOverlay({ event, camera }: { event?: DetectionEvent; camera: Camera }) {
  if (!event || event.severity !== "critical") return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-20 z-30 w-[min(92%,470px)] -translate-x-1/2 animate-alert-in border border-destructive/70 border-l-4 bg-background/92 shadow-[0_0_24px_color-mix(in_oklab,var(--destructive)_32%,transparent)] backdrop-blur-md">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 p-3">
        <div className="grid size-9 place-items-center border border-destructive/50 bg-destructive/12 text-destructive"><AlertTriangle className="size-5" /></div>
        <div className="min-w-0"><p className="font-mono text-[9px] font-bold uppercase text-destructive">Critical alert · human review required</p><h3 className="mt-0.5 text-sm font-bold uppercase text-foreground">{eventTitle(event)}</h3><p className="text-xs text-muted-foreground">{eventSubtitle(event) ?? "AI detection"}</p></div>
        {event.sourceMode === "demo" && <span className="border border-warning/40 px-1.5 py-0.5 font-mono text-[9px] text-warning">DEMO</span>}
      </div>
      <dl className="grid grid-cols-3 border-t border-destructive/30 bg-destructive/5 font-mono text-[9px]">
        <div className="border-r border-destructive/20 p-2"><dt className="text-muted-foreground">TRACK / TRIGGER</dt><dd className="mt-0.5 text-foreground">{event.personTrackingId ? `ID ${event.personTrackingId}` : "—"} · {formatPercent(event.triggerConfidence ?? event.confidence)}</dd></div>
        <div className="border-r border-destructive/20 p-2"><dt className="text-muted-foreground">DURATION / ASSOC.</dt><dd className="mt-0.5 text-foreground">{formatSeconds(event.detectionDurationSeconds)} · {formatPercent(event.associationConfidence)}</dd></div>
        <div className="p-2"><dt className="text-muted-foreground">CAMERA</dt><dd className="mt-0.5 truncate text-foreground">{camera.name}</dd></div>
      </dl>
    </div>
  );
}