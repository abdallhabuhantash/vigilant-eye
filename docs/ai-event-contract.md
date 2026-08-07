# AI Event Contract (Python service → Lovable)

The Python AI service is the only producer of events. It writes rows to
`public.events` with the service role key. The web app never infers AI data
from free text — the reviewer `note` is for humans only.

## Event row

| Column | Type | Meaning |
| --- | --- | --- |
| `type` | text | Generic identifier, e.g. `suspicious_cheating_activity`, `possible_cheating_activity`, `mobile_phone_detected`. Unknown values render humanised. |
| `severity` | text | `critical` \| `warning` \| `info` |
| `status` | text | Human review lifecycle: `new` → `under_review` → `confirmed` \| `rejected`. Never set by AI beyond `new`. |
| `camera_id` / `camera_name` | uuid / text | Source camera. |
| `rule_id` | uuid | Rule that produced the event. |
| `person_tracking_id` | text | Temporary tracker ID. Not an identity. |
| `trigger_object_class` | text | e.g. `cell_phone`. Generic, not phone-specific in schema. |
| `trigger_confidence` | numeric | 0–1 confidence of the trigger object. |
| `association_status` | text | `associated` \| `uncertain` \| `unassociated` \| `not_applicable`. Independent of review status. |
| `association_confidence` | numeric | 0–1, null when not applicable. |
| `detection_duration_seconds` | numeric | Fractional seconds of persistence. |
| `detection_frame_count` | int | Matching frames observed. |
| `evidence` | jsonb array | See below. |
| `source_mode` | text | `live` \| `demo`. Demo rows are hidden in live mode. |
| `snapshot_path` | text | Object path inside the private `snapshots` bucket. |

## Evidence item

```json
{
  "object_id": "phone-17",
  "tracking_id": null,
  "class_name": "cell_phone",
  "confidence": 0.88,
  "bbox": { "x": 0.505, "y": 0.68, "width": 0.055, "height": 0.1 },
  "role": "trigger_object",
  "associated_person_tracking_id": "03",
  "association_confidence": 0.91
}
```

`bbox` values are normalized 0–1 relative to the analysed frame, never pixels,
so overlays scale with any viewport size. `role` is `person`,
`trigger_object`, or any future role.

## Alert semantics

- `associated` + duration ≥ rule threshold → `suspicious_cheating_activity`.
- `uncertain` → at most `possible_cheating_activity`; the UI presents it as
  "Mobile Phone Detected · Uncertain Person Association".
- `unassociated` → `mobile_phone_detected` only.
- No payload may ever assert confirmed cheating.

## Rule configuration read by the service

`ai_rules`: `confidence_threshold` (trigger object),
`person_confidence_threshold`, `association_confidence_threshold`,
`min_duration_seconds` (numeric), `min_matching_frames`, `cooldown_seconds`,
`require_person_association`, `save_snapshot`, `sound_notification`.
Camera scope comes from `ai_rule_cameras`.
