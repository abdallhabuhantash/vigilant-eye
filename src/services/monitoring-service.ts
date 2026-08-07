/**
 * Service layer. Every screen reads through these functions only.
 * All data now comes from the cloud backend; detection events are written
 * by the external Python AI service using its service credentials.
 */
import { supabase } from "@/integrations/supabase/client";
import { AI_HEARTBEAT_STALE_MS, NVR_HEARTBEAT_STALE_MS, isFresh } from "@/lib/health";
import type { Json, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import type {
  AiRule,
  AiServiceStatus,
  AppUser,
  Camera,
  CameraFleetSummary,
  DetectionEvent,
  EventStatus,
  EventsSummary,
  NvrStatus,
  OperationMode,
  ReportSummary,
  SystemSettings,
} from "@/types";

// Row shapes come from the generated backend types; mappers translate them
// into the UI-facing domain types declared in `@/types`.
type CameraRow = Tables<"cameras">;
type EventRow = Tables<"events">;
type RuleRow = Tables<"ai_rules">;
type ProfileRow = Tables<"profiles">;
type ServiceHealthRow = Tables<"service_health">;

/** Narrows a jsonb column to a readable key/value bag. */
const jsonRecord = (value: Json | null | undefined): Record<string, Json | undefined> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : {};

const fail = (error: { message: string } | null): void => {
  if (error) throw new Error(error.message);
};

const toCamera = (row: CameraRow): Camera => ({
  id: row.id as string,
  name: row.name as string,
  location: row.location as string,
  host: row.host as string,
  channel: row.channel as number,
  status: row.status as Camera["status"],
  aiEnabled: row.ai_enabled as boolean,
  recording: row.recording as boolean,
  resolution: row.resolution as string,
  fps: row.fps as number,
  isDemo: row.is_demo as boolean,
  lastHeartbeatAt: row.last_heartbeat_at as string,
});

const toEvent = (row: EventRow): DetectionEvent => ({
  id: row.id as string,
  type: row.type as DetectionEvent["type"],
  severity: row.severity as DetectionEvent["severity"],
  status: row.status as EventStatus,
  cameraId: (row.camera_id as string) ?? "",
  cameraName: row.camera_name as string,
  ruleId: (row.rule_id as string) ?? "",
  confidence: Number(row.confidence ?? 0),
  durationSeconds: row.duration_seconds as number,
  snapshotUrl: (row.snapshot_path as string) ?? null,
  detectedAt: row.detected_at as string,
  reviewedBy: (row.reviewed_by as string) ?? null,
  note: (row.note as string) ?? null,
});

const toRule = (row: RuleRow, cameraIds: string[]): AiRule => ({
  id: row.id as string,
  name: row.name as string,
  description: row.description as string,
  available: row.available as boolean,
  enabled: row.enabled as boolean,
  confidenceThreshold: Number(row.confidence_threshold ?? 0),
  minDurationSeconds: row.min_duration_seconds as number,
  cooldownSeconds: row.cooldown_seconds as number,
  severity: row.severity as AiRule["severity"],
  cameraIds,
  saveSnapshot: row.save_snapshot as boolean,
  soundNotification: row.sound_notification as boolean,
});

export const camerasService = {
  list: async (): Promise<Camera[]> => {
    const { data, error } = await supabase.from("cameras").select("*").order("channel");
    fail(error);
    return (data ?? []).map(toCamera);
  },
  get: async (id: string): Promise<Camera | undefined> => {
    const { data } = await supabase.from("cameras").select("*").eq("id", id).maybeSingle();
    return data ? toCamera(data) : undefined;
  },
  summary: async (): Promise<CameraFleetSummary> => {
    const cameras = await camerasService.list();
    return {
      total: cameras.length,
      online: cameras.filter((c) => c.status === "online").length,
      offline: cameras.filter((c) => c.status === "offline").length,
      degraded: cameras.filter((c) => c.status === "degraded").length,
      aiEnabled: cameras.filter((c) => c.aiEnabled).length,
      recording: cameras.filter((c) => c.recording).length,
    };
  },
  toggleAi: async (id: string, enabled: boolean): Promise<void> => {
    const { error } = await supabase.from("cameras").update({ ai_enabled: enabled }).eq("id", id);
    fail(error);
  },
  create: async (input: {
    name: string;
    location: string;
    host: string;
    channel: number;
    resolution: string;
    isDemo: boolean;
  }): Promise<void> => {
    const { error } = await supabase.from("cameras").insert({
      name: input.name,
      location: input.location,
      host: input.host,
      channel: input.channel,
      resolution: input.resolution,
      is_demo: input.isDemo,
    });
    fail(error);
  },
  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("cameras").delete().eq("id", id);
    fail(error);
  },
};

export const eventsService = {
  list: async (): Promise<DetectionEvent[]> => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("detected_at", { ascending: false })
      .limit(300);
    fail(error);
    return (data ?? []).map(toEvent);
  },
  recent: async (limit: number): Promise<DetectionEvent[]> => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("detected_at", { ascending: false })
      .limit(limit);
    fail(error);
    return (data ?? []).map(toEvent);
  },
  summary: async (): Promise<EventsSummary> => {
    const events = await eventsService.list();
    return {
      today: events.length,
      critical: events.filter((e) => e.severity === "critical").length,
      pendingReview: events.filter((e) => e.status === "new" || e.status === "under_review").length,
      confirmed: events.filter((e) => e.status === "confirmed").length,
      rejected: events.filter((e) => e.status === "rejected").length,
    };
  },
  /**
   * Review goes through a secure database function. Detection evidence
   * (type, confidence, camera, rule, timestamps, snapshot) cannot be changed
   * by any signed-in user; only the review outcome is writable.
   */
  review: async (id: string, status: EventStatus, note?: string): Promise<void> => {
    const { error } = await supabase.rpc("review_event", {
      _event_id: id,
      _status: status,
      _note: note ?? null,
    });
    fail(error);
  },
  snapshotUrl: async (path: string | null): Promise<string | null> => {
    if (!path) return null;
    const { data } = await supabase.storage.from("snapshots").createSignedUrl(path, 300);
    return data?.signedUrl ?? null;
  },
};

export const rulesService = {
  list: async (): Promise<AiRule[]> => {
    const [rules, links] = await Promise.all([
      supabase.from("ai_rules").select("*").order("created_at"),
      supabase.from("ai_rule_cameras").select("*"),
    ]);
    fail(rules.error);
    fail(links.error);
    return (rules.data ?? []).map((row) =>
      toRule(
        row,
        (links.data ?? [])
          .filter((link) => link.rule_id === row.id)
          .map((link) => link.camera_id as string),
      ),
    );
  },
  update: async (id: string, patch: Partial<AiRule>): Promise<void> => {
    const payload: TablesUpdate<"ai_rules"> = {};
    if (patch.enabled !== undefined) payload.enabled = patch.enabled;
    if (patch.confidenceThreshold !== undefined)
      payload.confidence_threshold = patch.confidenceThreshold;
    if (patch.minDurationSeconds !== undefined)
      payload.min_duration_seconds = patch.minDurationSeconds;
    if (patch.cooldownSeconds !== undefined) payload.cooldown_seconds = patch.cooldownSeconds;
    if (patch.severity !== undefined) payload.severity = patch.severity;
    if (patch.saveSnapshot !== undefined) payload.save_snapshot = patch.saveSnapshot;
    if (patch.soundNotification !== undefined)
      payload.sound_notification = patch.soundNotification;
    if (Object.keys(payload).length === 0) return;
    const { error } = await supabase.from("ai_rules").update(payload).eq("id", id);
    fail(error);
  },
};

const toUser = (row: ProfileRow, role: string | undefined): AppUser => ({
  id: row.id as string,
  fullName: (row.full_name as string) || (row.email as string),
  email: row.email as string,
  role: (role as AppUser["role"]) ?? "operator",
  status: row.status as AppUser["status"],
  lastActiveAt: row.last_active_at as string,
});

export const usersService = {
  list: async (): Promise<AppUser[]> => {
    const [profiles, roles] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at"),
      supabase.from("user_roles").select("*"),
    ]);
    fail(profiles.error);
    fail(roles.error);
    return (profiles.data ?? []).map((row) =>
      toUser(
        row,
        (roles.data ?? []).find((entry) => entry.user_id === row.id)?.role as string | undefined,
      ),
    );
  },
  byId: async (id: string): Promise<AppUser | null> => {
    const [profile, roles] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", id),
    ]);
    if (!profile.data) return null;
    return toUser(profile.data, (roles.data ?? [])[0]?.role as string | undefined);
  },
};

export const systemService = {
  operationMode: async (): Promise<OperationMode> => {
    const { data } = await supabase.from("system_settings").select("*").maybeSingle();
    return (data?.operation_mode as OperationMode) ?? "demo";
  },
  aiStatus: async (mode: OperationMode): Promise<AiServiceStatus> => {
    const { data } = await supabase
      .from("service_health")
      .select("*")
      .eq("service", "ai")
      .maybeSingle();
    const row: ServiceHealthRow | null = data;
    const isDemo = Boolean(row?.is_demo);
    // In live mode a demo placeholder is not a connected service.
    const usable = row && (mode === "demo" || !isDemo);
    const payload = usable ? jsonRecord(row.payload) : {};
    const lastPingAt = (row?.updated_at as string) ?? null;
    const stale = usable ? !isFresh(lastPingAt, AI_HEARTBEAT_STALE_MS) : true;
    return {
      // A stored `online` flag is only believed while the heartbeat is fresh.
      online: Boolean(usable && row.online) && !stale,
      version: (payload.version as string) ?? "—",
      model: (payload.model as string) ?? "—",
      device: (payload.device as string) ?? "—",
      inferenceFps: Number(payload.inference_fps ?? 0),
      queueDepth: Number(payload.queue_depth ?? 0),
      gpuLoadPercent: Number(payload.gpu_load_percent ?? 0),
      uptimeSeconds: Number(payload.uptime_seconds ?? 0),
      lastPingAt: lastPingAt ?? "",
      stale,
      isDemo: Boolean(usable && isDemo),
      neverReported: !row || (mode === "live" && isDemo),
    };
  },
  nvrStatus: async (mode: OperationMode): Promise<NvrStatus> => {
    const { data } = await supabase
      .from("service_health")
      .select("*")
      .eq("service", "nvr")
      .maybeSingle();
    const row: ServiceHealthRow | null = data;
    const isDemo = Boolean(row?.is_demo);
    const usable = row && (mode === "demo" || !isDemo);
    const payload = usable ? jsonRecord(row.payload) : {};
    const lastSyncAt = (row?.updated_at as string) ?? null;
    const stale = usable ? !isFresh(lastSyncAt, NVR_HEARTBEAT_STALE_MS) : true;
    return {
      online: Boolean(usable && row.online) && !stale,
      model: (payload.model as string) ?? "—",
      channelsUsed: Number(payload.channels_used ?? 0),
      channelsTotal: Number(payload.channels_total ?? 0),
      storageUsedPercent: Number(payload.storage_used_percent ?? 0),
      retentionDays: Number(payload.retention_days ?? 0),
      lastSyncAt: lastSyncAt ?? "",
      stale,
      isDemo: Boolean(usable && isDemo),
      neverReported: !row || (mode === "live" && isDemo),
    };
  },
  settings: async (): Promise<SystemSettings> => {
    const { data } = await supabase.from("system_settings").select("*").maybeSingle();
    return {
      operationMode: (data?.operation_mode as OperationMode) ?? "demo",
      aiServiceUrl: (data?.ai_service_url as string) ?? "",
      websocketUrl: (data?.websocket_url as string) ?? "",
      retentionDays: Number(data?.retention_days ?? 30),
      snapshotStorage: (data?.snapshot_storage as SystemSettings["snapshotStorage"]) ?? "cloud",
      soundAlerts: Boolean(data?.sound_alerts),
      autoAcknowledgeMinutes: Number(data?.auto_acknowledge_minutes ?? 30),
      timezone: (data?.timezone as string) ?? "Asia/Amman",
    };
  },
  updateSettings: async (patch: Partial<SystemSettings>): Promise<void> => {
    const payload: TablesInsert<"system_settings"> = {
      id: true,
      updated_at: new Date().toISOString(),
    };
    if (patch.operationMode !== undefined) payload.operation_mode = patch.operationMode;
    if (patch.aiServiceUrl !== undefined) payload.ai_service_url = patch.aiServiceUrl;
    if (patch.websocketUrl !== undefined) payload.websocket_url = patch.websocketUrl;
    if (patch.retentionDays !== undefined) payload.retention_days = patch.retentionDays;
    if (patch.snapshotStorage !== undefined) payload.snapshot_storage = patch.snapshotStorage;
    if (patch.soundAlerts !== undefined) payload.sound_alerts = patch.soundAlerts;
    if (patch.autoAcknowledgeMinutes !== undefined)
      payload.auto_acknowledge_minutes = patch.autoAcknowledgeMinutes;
    if (patch.timezone !== undefined) payload.timezone = patch.timezone;
    const { error } = await supabase.from("system_settings").upsert(payload);
    fail(error);
  },
};

export const reportsService = {
  summary: async (range: "7d" | "30d"): Promise<ReportSummary> => {
    const days = range === "7d" ? 7 : 30;
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .gte("detected_at", since)
      .order("detected_at");
    fail(error);
    const events = (data ?? []).map(toEvent);

    const buckets = range === "7d" ? 7 : 4;
    const bucketMs = range === "7d" ? 86_400_000 : 7 * 86_400_000;
    const start = Date.now() - buckets * bucketMs;
    const timeline = Array.from({ length: buckets }, (_, index) => {
      const from = start + index * bucketMs;
      const to = from + bucketMs;
      const inBucket = events.filter((event) => {
        const at = new Date(event.detectedAt).getTime();
        return at >= from && at < to;
      });
      return {
        label:
          range === "7d"
            ? new Date(from).toLocaleDateString(undefined, { weekday: "short" })
            : `W${index + 1}`,
        events: inBucket.length,
        confirmed: inBucket.filter((event) => event.status === "confirmed").length,
      };
    });

    const byCameraMap = new Map<string, number>();
    events.forEach((event) => {
      byCameraMap.set(event.cameraName, (byCameraMap.get(event.cameraName) ?? 0) + 1);
    });

    const reviewed = events.filter(
      (event) => event.status === "confirmed" || event.status === "rejected",
    );

    return {
      range,
      timeline,
      byCamera: [...byCameraMap.entries()]
        .map(([cameraName, count]) => ({ cameraName, events: count }))
        .sort((a, b) => b.events - a.events),
      confirmationRate: reviewed.length
        ? events.filter((event) => event.status === "confirmed").length / reviewed.length
        : 0,
      averageReviewMinutes: 0,
    };
  },
};
