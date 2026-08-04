export type UserRole = "administrator" | "operator";

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: "active" | "suspended";
  lastActiveAt: string;
}

export type CameraStatus = "online" | "offline" | "degraded";

export interface Camera {
  id: string;
  name: string;
  location: string;
  /** Host only. RTSP credentials are never exposed to the browser. */
  host: string;
  channel: number;
  status: CameraStatus;
  aiEnabled: boolean;
  recording: boolean;
  resolution: string;
  fps: number;
  isDemo: boolean;
  lastHeartbeatAt: string;
}

export type EventSeverity = "critical" | "warning" | "info";
export type EventStatus = "new" | "under_review" | "confirmed" | "rejected";
export type EventType =
  | "suspicious_cheating_activity"
  | "possible_cheating_activity"
  | "mobile_phone_detected";

export interface DetectionEvent {
  id: string;
  type: EventType;
  severity: EventSeverity;
  status: EventStatus;
  cameraId: string;
  cameraName: string;
  ruleId: string;
  confidence: number;
  durationSeconds: number;
  snapshotUrl: string | null;
  detectedAt: string;
  reviewedBy: string | null;
  note: string | null;
}

export type DetectionAlertState = "normal" | "evaluating" | "alert" | "uncertain";

export interface DetectionOverlay {
  objectId: string;
  trackingId: string | null;
  className: "person" | "cell_phone";
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  associatedPersonId: string | null;
  associationConfidence: number | null;
  alertState: DetectionAlertState;
}

export interface AiRule {
  id: string;
  name: string;
  description: string;
  available: boolean;
  enabled: boolean;
  confidenceThreshold: number;
  minDurationSeconds: number;
  cooldownSeconds: number;
  severity: EventSeverity;
  cameraIds: string[];
  saveSnapshot: boolean;
  soundNotification: boolean;
}

export interface AiServiceStatus {
  online: boolean;
  version: string;
  model: string;
  device: string;
  inferenceFps: number;
  queueDepth: number;
  gpuLoadPercent: number;
  uptimeSeconds: number;
  lastPingAt: string;
}

export interface NvrStatus {
  online: boolean;
  model: string;
  channelsUsed: number;
  channelsTotal: number;
  storageUsedPercent: number;
  retentionDays: number;
  lastSyncAt: string;
}

export interface CameraFleetSummary {
  total: number;
  online: number;
  offline: number;
  degraded: number;
  aiEnabled: number;
  recording: number;
}

export interface EventsSummary {
  today: number;
  critical: number;
  pendingReview: number;
  confirmed: number;
  rejected: number;
}

export interface ReportPoint {
  label: string;
  events: number;
  confirmed: number;
}

export interface ReportSummary {
  range: "7d" | "30d";
  timeline: ReportPoint[];
  byCamera: { cameraName: string; events: number }[];
  confirmationRate: number;
  averageReviewMinutes: number;
}

export interface SystemSettings {
  aiServiceUrl: string;
  websocketUrl: string;
  retentionDays: number;
  snapshotStorage: "local" | "cloud";
  soundAlerts: boolean;
  autoAcknowledgeMinutes: number;
  timezone: string;
}

export interface AuthSession {
  user: AppUser;
  issuedAt: string;
}