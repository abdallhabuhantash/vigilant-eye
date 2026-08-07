import type { Camera, CameraStatus } from "@/types";

/** Heartbeat freshness thresholds. A stored `online` flag alone is never trusted. */
export const AI_HEARTBEAT_STALE_MS = 30_000;
export const NVR_HEARTBEAT_STALE_MS = 120_000;
export const CAMERA_HEARTBEAT_STALE_MS = 60_000;

export function isFresh(timestamp: string | null | undefined, thresholdMs: number): boolean {
  if (!timestamp) return false;
  const at = new Date(timestamp).getTime();
  if (Number.isNaN(at)) return false;
  return Date.now() - at <= thresholdMs;
}

/**
 * UI status for a camera. The database `status` column is preserved as the
 * reported value, but a camera whose heartbeat has stopped is shown offline.
 */
export function effectiveCameraStatus(camera: Camera): CameraStatus {
  if (camera.isDemo) return camera.status;
  if (!isFresh(camera.lastHeartbeatAt, CAMERA_HEARTBEAT_STALE_MS)) return "offline";
  return camera.status;
}

export function isCameraStale(camera: Camera): boolean {
  if (camera.isDemo) return false;
  return !isFresh(camera.lastHeartbeatAt, CAMERA_HEARTBEAT_STALE_MS);
}
