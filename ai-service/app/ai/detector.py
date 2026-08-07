"""Ultralytics YOLO wrapper with built-in tracking.

Class IDs are discovered from `model.names`, never hard-coded, so switching to
another YOLO checkpoint requires no code change.
"""

from __future__ import annotations

import logging
import threading
from typing import Optional

from ..domain.geometry import normalize_xyxy
from ..domain.models import CLASS_PERSON, CLASS_PHONE, Detection, FrameDetections

logger = logging.getLogger(__name__)

#: Model label -> application class name.
LABEL_MAP = {
    "person": CLASS_PERSON,
    "cell phone": CLASS_PHONE,
    "cell_phone": CLASS_PHONE,
    "mobile phone": CLASS_PHONE,
}


def resolve_device(configured: str) -> str:
    """`auto` picks CUDA when available, otherwise CPU. Never hard-coded GPU."""
    if configured and configured.lower() != "auto":
        return configured
    try:
        import torch  # imported lazily: heavy dependency

        if torch.cuda.is_available():
            return "cuda:0"
    except Exception:  # pragma: no cover - torch absent or broken
        pass
    return "cpu"


def wanted_class_ids(names: dict[int, str]) -> dict[int, str]:
    """Maps the model's own class IDs to the two classes this engine needs."""
    wanted: dict[int, str] = {}
    for class_id, label in names.items():
        mapped = LABEL_MAP.get(str(label).strip().lower())
        if mapped:
            wanted[int(class_id)] = mapped
    return wanted


class YoloDetector:
    """Thread-safe front-end for one shared Ultralytics model.

    Ultralytics tracker state is not thread-safe, so inference is serialised
    behind a lock; per-camera tracker state is kept isolated by using a
    separate persistent tracker per camera id.
    """

    def __init__(self, model_name: str, device: str, imgsz: int, tracker: str) -> None:
        from ultralytics import YOLO  # imported lazily so unit tests stay light

        self.device = resolve_device(device)
        self.model_name = model_name
        self.imgsz = int(imgsz)
        self.tracker = tracker
        self._lock = threading.Lock()
        self._model = YOLO(model_name)
        self._classes = wanted_class_ids(dict(self._model.names))
        self._known_cameras: set[str] = set()
        logger.info(
            "YOLO model %s ready on %s (classes: %s)",
            model_name,
            self.device,
            sorted(set(self._classes.values())),
        )

    @property
    def class_ids(self) -> list[int]:
        return sorted(self._classes)

    def reset_camera(self, camera_id: str) -> None:
        self._known_cameras.discard(camera_id)

    def detect(self, frame, camera_id: str, min_confidence: float = 0.20) -> FrameDetections:
        """Runs tracked inference on one BGR frame and returns typed detections."""
        height, width = frame.shape[:2]
        with self._lock:
            persist = camera_id in self._known_cameras
            self._known_cameras.add(camera_id)
            results = self._model.track(
                source=frame,
                persist=persist,
                tracker=self.tracker,
                imgsz=self.imgsz,
                device=self.device,
                classes=self.class_ids,
                conf=min_confidence,
                verbose=False,
            )

        persons: list[Detection] = []
        phones: list[Detection] = []
        if not results:
            return FrameDetections()

        boxes = getattr(results[0], "boxes", None)
        if boxes is None:
            return FrameDetections()

        for index in range(len(boxes)):
            class_id = int(boxes.cls[index].item())
            class_name = self._classes.get(class_id)
            if not class_name:
                continue
            confidence = float(boxes.conf[index].item())
            x1, y1, x2, y2 = (float(v) for v in boxes.xyxy[index].tolist())
            tracking_id: Optional[str] = None
            if getattr(boxes, "id", None) is not None:
                tracking_id = f"{int(boxes.id[index].item()):02d}"
            detection = Detection(
                class_name=class_name,
                confidence=confidence,
                bbox=normalize_xyxy(x1, y1, x2, y2, width, height),
                tracking_id=tracking_id,
            )
            if class_name == CLASS_PERSON:
                persons.append(detection)
            else:
                phones.append(detection)

        return FrameDetections(persons=tuple(persons), phones=tuple(phones))