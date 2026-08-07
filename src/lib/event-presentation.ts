import type { AssociationStatus, DetectionEvent, EventType } from "@/types";

const knownLabels: Record<string, string> = {
  suspicious_cheating_activity: "Suspicious Cheating Activity",
  possible_cheating_activity: "Possible Cheating Activity",
  mobile_phone_detected: "Mobile Phone Detected",
};

/** Humanises any event type identifier, including future/unknown ones. */
export function eventTypeLabel(type: EventType): string {
  return (
    knownLabels[type] ??
    type
      .split("_")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

export const associationLabel: Record<AssociationStatus, string> = {
  associated: "Associated",
  uncertain: "Uncertain Association",
  unassociated: "No Person Association",
  not_applicable: "Not Applicable",
};

/** True when the event carries person/phone association data worth showing. */
export function hasAssociationData(event: DetectionEvent): boolean {
  return event.associationStatus !== "not_applicable" || event.triggerObjectClass !== null;
}

/**
 * Uncertain association must never be presented as a confirmed accusation.
 * The AI service decides severity; the UI only refuses to over-claim.
 */
export function eventTitle(event: DetectionEvent): string {
  if (event.associationStatus === "uncertain") return "Mobile Phone Detected";
  return eventTypeLabel(event.type);
}

export function eventSubtitle(event: DetectionEvent): string | null {
  if (event.associationStatus === "uncertain") return "Uncertain Person Association";
  if (event.triggerObjectClass === "cell_phone" && event.type !== "mobile_phone_detected")
    return "Mobile Phone Detected";
  if (event.triggerObjectClass) return eventTypeLabel(event.triggerObjectClass);
  return null;
}

/** Person tracking IDs are only shown when the AI reliably associated them. */
export function displayPersonId(event: DetectionEvent): string | null {
  if (event.associationStatus === "associated" && event.personTrackingId)
    return event.personTrackingId;
  return null;
}

export function formatSeconds(value: number | null): string {
  if (value === null) return "—";
  return `${Number(value)
    .toFixed(2)
    .replace(/\.?0+$/, "")} s`;
}

export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}
