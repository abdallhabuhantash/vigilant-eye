import type { Camera, DetectionEvent, DetectionOverlay } from "@/types";

const now = Date.now();

export const demoCameras: Camera[] = [
  { id: "demo-exam-front", name: "Exam Hall A — Front", location: "North Campus · Level 2", host: "demo", channel: 1, status: "online", aiEnabled: true, recording: true, resolution: "1920×1080", fps: 22, isDemo: true, lastHeartbeatAt: new Date(now).toISOString() },
  { id: "demo-exam-rear", name: "Exam Hall A — Rear", location: "North Campus · Level 2", host: "demo", channel: 2, status: "online", aiEnabled: true, recording: true, resolution: "1920×1080", fps: 20, isDemo: true, lastHeartbeatAt: new Date(now - 4_000).toISOString() },
  { id: "demo-exam-b", name: "Exam Hall B", location: "North Campus · Level 3", host: "demo", channel: 3, status: "degraded", aiEnabled: true, recording: true, resolution: "1280×720", fps: 14, isDemo: true, lastHeartbeatAt: new Date(now - 15_000).toISOString() },
  { id: "demo-computer-lab", name: "Computer Lab", location: "Technology Building", host: "demo", channel: 4, status: "offline", aiEnabled: false, recording: false, resolution: "1920×1080", fps: 0, isDemo: true, lastHeartbeatAt: new Date(now - 420_000).toISOString() },
];

export const demoDetections: DetectionOverlay[] = [
  { objectId: "person-03", trackingId: "03", className: "person", confidence: 0.94, x: 43, y: 38, width: 19, height: 53, associatedPersonId: null, associationConfidence: null, alertState: "alert" },
  { objectId: "phone-17", trackingId: null, className: "cell_phone", confidence: 0.88, x: 50.5, y: 68, width: 5.5, height: 10, associatedPersonId: "person-03", associationConfidence: 0.91, alertState: "alert" },
  { objectId: "person-08", trackingId: "08", className: "person", confidence: 0.91, x: 18, y: 49, width: 12, height: 39, associatedPersonId: null, associationConfidence: null, alertState: "normal" },
  { objectId: "phone-22", trackingId: null, className: "cell_phone", confidence: 0.62, x: 76, y: 63, width: 4, height: 8, associatedPersonId: "person-11", associationConfidence: 0.54, alertState: "uncertain" },
];

export const demoEvents: DetectionEvent[] = [
  { id: "demo-event-critical", type: "suspicious_cheating_activity", severity: "critical", status: "new", cameraId: "demo-exam-front", cameraName: "Exam Hall A — Front", ruleId: "mobile-phone-rule", confidence: 0.88, durationSeconds: 1.8, snapshotUrl: null, detectedAt: new Date(now - 18_000).toISOString(), reviewedBy: null, note: "Person ID 03 · Mobile Phone Detected" },
  { id: "demo-event-uncertain", type: "possible_cheating_activity", severity: "warning", status: "under_review", cameraId: "demo-exam-rear", cameraName: "Exam Hall A — Rear", ruleId: "mobile-phone-rule", confidence: 0.62, durationSeconds: 0.9, snapshotUrl: null, detectedAt: new Date(now - 165_000).toISOString(), reviewedBy: null, note: "Person ID 11 · Uncertain Phone Association" },
  { id: "demo-event-rejected", type: "mobile_phone_detected", severity: "info", status: "rejected", cameraId: "demo-exam-b", cameraName: "Exam Hall B", ruleId: "mobile-phone-rule", confidence: 0.71, durationSeconds: 1.1, snapshotUrl: null, detectedAt: new Date(now - 520_000).toISOString(), reviewedBy: "Operator", note: "Person ID 06 · False positive rejected" },
];

export function mergeDemoCameras(cameras: Camera[]): Camera[] {
  if (cameras.length >= 4) return cameras;
  const channels = new Set(cameras.map((camera) => camera.channel));
  return [...cameras, ...demoCameras.filter((camera) => !channels.has(camera.channel))].slice(0, 4);
}