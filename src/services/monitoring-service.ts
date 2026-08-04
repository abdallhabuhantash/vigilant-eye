/**
 * Replaceable service layer.
 *
 * Every screen reads through these functions only. When the Supabase backend
 * and the Python AI REST API are wired in, swap the bodies here — no UI file
 * needs to change.
 */
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
  ReportSummary,
  SystemSettings,
} from "@/types";
import {
  mockAiStatus,
  mockCameras,
  mockEvents,
  mockNvrStatus,
  mockReports,
  mockRules,
  mockSettings,
  mockUsers,
} from "./mock/mock-data";

const LATENCY_MS = 220;

const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

const store = {
  cameras: [...mockCameras],
  events: [...mockEvents],
  rules: [...mockRules],
  users: [...mockUsers],
  settings: { ...mockSettings },
};

export const camerasService = {
  list: (): Promise<Camera[]> => delay([...store.cameras]),
  get: (id: string): Promise<Camera | undefined> =>
    delay(store.cameras.find((camera) => camera.id === id)),
  summary: (): Promise<CameraFleetSummary> =>
    delay({
      total: store.cameras.length,
      online: store.cameras.filter((c) => c.status === "online").length,
      offline: store.cameras.filter((c) => c.status === "offline").length,
      degraded: store.cameras.filter((c) => c.status === "degraded").length,
      aiEnabled: store.cameras.filter((c) => c.aiEnabled).length,
      recording: store.cameras.filter((c) => c.recording).length,
    }),
  toggleAi: (id: string, enabled: boolean): Promise<Camera[]> => {
    store.cameras = store.cameras.map((camera) =>
      camera.id === id ? { ...camera, aiEnabled: enabled } : camera,
    );
    return delay([...store.cameras]);
  },
  toggleRecording: (id: string, recording: boolean): Promise<Camera[]> => {
    store.cameras = store.cameras.map((camera) =>
      camera.id === id ? { ...camera, recording } : camera,
    );
    return delay([...store.cameras]);
  },
};

export const eventsService = {
  list: (): Promise<DetectionEvent[]> => delay([...store.events]),
  recent: (limit: number): Promise<DetectionEvent[]> => delay(store.events.slice(0, limit)),
  summary: (): Promise<EventsSummary> =>
    delay({
      today: store.events.length,
      critical: store.events.filter((e) => e.severity === "critical").length,
      pendingReview: store.events.filter((e) => e.status === "new" || e.status === "under_review")
        .length,
      confirmed: store.events.filter((e) => e.status === "confirmed").length,
      rejected: store.events.filter((e) => e.status === "rejected").length,
    }),
  review: (id: string, status: EventStatus, reviewer: string): Promise<DetectionEvent[]> => {
    store.events = store.events.map((event) =>
      event.id === id ? { ...event, status, reviewedBy: reviewer } : event,
    );
    return delay([...store.events]);
  },
};

export const rulesService = {
  list: (): Promise<AiRule[]> => delay([...store.rules]),
  update: (id: string, patch: Partial<AiRule>): Promise<AiRule[]> => {
    store.rules = store.rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule));
    return delay([...store.rules]);
  },
};

export const usersService = {
  list: (): Promise<AppUser[]> => delay([...store.users]),
};

export const systemService = {
  aiStatus: (): Promise<AiServiceStatus> => delay({ ...mockAiStatus }),
  nvrStatus: (): Promise<NvrStatus> => delay({ ...mockNvrStatus }),
  settings: (): Promise<SystemSettings> => delay({ ...store.settings }),
  updateSettings: (patch: Partial<SystemSettings>): Promise<SystemSettings> => {
    store.settings = { ...store.settings, ...patch };
    return delay({ ...store.settings });
  },
};

export const reportsService = {
  summary: (range: "7d" | "30d"): Promise<ReportSummary> => delay(mockReports[range]),
};