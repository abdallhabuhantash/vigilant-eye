import { Link } from "@tanstack/react-router";
import { AlertTriangle, Filter, Image as ImageIcon } from "lucide-react";
import { StatusBadge, eventTypeLabel } from "@/components/common/EventBadges";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DetectionEvent } from "@/types";

function LiveEventCard({ event }: { event: DetectionEvent }) {
  const person = event.note?.match(/Person ID\s*(\d+)/)?.[1];
  return (
    <article className={cn("grid grid-cols-[64px_minmax(0,1fr)] gap-2 border-b border-border/70 p-3 transition-colors hover:bg-accent/30", event.severity === "critical" && "border-l-2 border-l-destructive bg-destructive/5", event.severity === "warning" && "border-l-2 border-l-warning")}>
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden border border-border bg-background hud-grid"><ImageIcon className="size-4 text-muted-foreground" /><span className="absolute left-1 top-1 border border-warning/40 bg-background/80 px-0.5 font-mono text-[7px] text-warning">DEMO</span></div>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2"><span className={cn("font-mono text-[8px] font-bold uppercase", event.severity === "critical" ? "text-destructive" : event.severity === "warning" ? "text-warning" : "text-info")}>{event.severity}</span><span className="font-mono text-[8px] text-muted-foreground">{formatRelative(event.detectedAt)}</span></div>
        <h3 className="mt-0.5 truncate text-[11px] font-semibold text-foreground">{eventTypeLabel[event.type]}</h3>
        <p className="truncate text-[9px] text-muted-foreground">{event.note ?? "AI Detection · Review required"}</p>
        <p className="mt-1 truncate font-mono text-[8px] text-muted-foreground">{event.cameraName}{person ? ` · PERSON ${person}` : ""}</p>
        <div className="mt-1.5 flex items-center justify-between gap-2"><span className="font-mono text-[9px] text-primary">{Math.round(event.confidence * 100)}% CONF.</span><StatusBadge status={event.status} /></div>
      </div>
    </article>
  );
}

export function LiveEventPanel({ events }: { events: DetectionEvent[] }) {
  const pending = events.filter((event) => event.status === "new").length;
  return <aside className="flex min-h-0 w-full flex-col border-l border-border bg-surface lg:w-[350px] lg:shrink-0"><header className="grid h-12 grid-cols-[minmax(0,1fr)_auto] items-center border-b border-border px-3"><div className="flex min-w-0 items-center gap-2"><AlertTriangle className="size-3.5 text-warning" /><h2 className="label-tech text-foreground">Live events</h2><span className="font-mono text-[9px] text-primary">{pending} NEW</span></div><div className="flex"><Button variant="ghost" size="icon" className="size-7" aria-label="Filter events"><Filter className="size-3.5" /></Button><Button asChild variant="ghost" size="sm" className="h-7 px-2 font-mono text-[9px]"><Link to="/events">VIEW ALL</Link></Button></div></header><div className="min-h-0 flex-1 overflow-y-auto">{events.map((event) => <LiveEventCard key={event.id} event={event} />)}</div><div className="border-t border-border p-2 text-center font-mono text-[8px] uppercase text-muted-foreground">AI detections are advisory · Human review required</div></aside>;
}