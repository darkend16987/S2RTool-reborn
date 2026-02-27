"""
core/history_manager.py - Render History Manager

Saves rendered images + metadata locally on disk.
Directory: backend/render_history/ (gitignored, not synced to git)
Each render = 1 PNG file + 1 JSON metadata file.
"""

import os
import json
import uuid
import base64
import io
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

from PIL import Image

# History directory inside backend/ folder
HISTORY_BASE_DIR = Path(__file__).parent.parent / "render_history"

VALID_MODES = ["building", "interior", "planning", "planning_detail", "object_swap", "floorplan"]


class HistoryManager:
    """Manages saved render history to local disk."""

    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = base_dir or HISTORY_BASE_DIR
        self._ensure_dirs()

    def _ensure_dirs(self):
        """Create mode subdirectories if missing."""
        for mode in VALID_MODES:
            (self.base_dir / mode).mkdir(parents=True, exist_ok=True)

    def save_render(
        self,
        image_pil: Image.Image,
        mode: str,
        prompt_summary: str = "",
        source_image_pil: Optional[Image.Image] = None,
        settings: Optional[Dict] = None
    ) -> str:
        """
        Save a rendered image + metadata.
        Returns the render ID (8-char hex).
        """
        if mode not in VALID_MODES:
            mode = "building"

        render_id = uuid.uuid4().hex[:8]
        timestamp = datetime.now()
        ts_str = timestamp.strftime("%Y%m%d_%H%M%S")
        filename = f"{ts_str}_{render_id}.png"
        mode_dir = self.base_dir / mode

        # Save full-resolution image
        image_pil.save(mode_dir / filename, format="PNG")

        # Create thumbnail (400px max side) for gallery
        thumb = image_pil.copy()
        thumb.thumbnail((400, 400))
        thumb_buf = io.BytesIO()
        thumb.save(thumb_buf, format="JPEG", quality=75)
        thumb_b64 = base64.b64encode(thumb_buf.getvalue()).decode("utf-8")

        # Source image thumbnail (optional, 200px)
        source_thumb_b64 = ""
        if source_image_pil:
            src_thumb = source_image_pil.copy()
            src_thumb.thumbnail((200, 200))
            src_buf = io.BytesIO()
            src_thumb.save(src_buf, format="JPEG", quality=70)
            source_thumb_b64 = base64.b64encode(src_buf.getvalue()).decode("utf-8")

        # Build metadata
        metadata = {
            "id": render_id,
            "timestamp": timestamp.isoformat(),
            "mode": mode,
            "filename": filename,
            "thumbnail_b64": thumb_b64,
            "source_thumbnail_b64": source_thumb_b64,
            "prompt_summary": prompt_summary[:300],
            "settings": settings or {}
        }

        meta_path = mode_dir / f"{ts_str}_{render_id}.json"
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        print(f"📁 History saved: {mode}/{filename}")
        return render_id

    def list_renders(
        self,
        mode: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict:
        """
        List renders, newest first.
        Returns paginated result with thumbnail (no source_thumb to keep payload small).
        """
        all_items = []
        modes_to_scan = [mode] if mode and mode in VALID_MODES else VALID_MODES

        for m in modes_to_scan:
            mode_dir = self.base_dir / m
            if not mode_dir.exists():
                continue
            for json_file in mode_dir.glob("*.json"):
                try:
                    with open(json_file, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                    # Strip source thumbnail from list view (heavy)
                    meta.pop("source_thumbnail_b64", None)
                    all_items.append(meta)
                except Exception:
                    pass

        # Sort newest first
        all_items.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

        total = len(all_items)
        start = (page - 1) * limit
        end = start + limit

        return {
            "items": all_items[start:end],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": max(1, (total + limit - 1) // limit)
        }

    def get_render_detail(self, render_id: str, mode: Optional[str] = None) -> Optional[Dict]:
        """Get full metadata including source_thumbnail_b64."""
        modes_to_scan = [mode] if mode and mode in VALID_MODES else VALID_MODES
        for m in modes_to_scan:
            mode_dir = self.base_dir / m
            if not mode_dir.exists():
                continue
            for json_file in mode_dir.glob(f"*_{render_id}.json"):
                try:
                    with open(json_file, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception:
                    return None
        return None

    def get_render_image_bytes(self, render_id: str, mode: Optional[str] = None) -> Optional[bytes]:
        """Return raw PNG bytes for download."""
        modes_to_scan = [mode] if mode and mode in VALID_MODES else VALID_MODES
        for m in modes_to_scan:
            mode_dir = self.base_dir / m
            if not mode_dir.exists():
                continue
            for img_file in mode_dir.glob(f"*_{render_id}.png"):
                return img_file.read_bytes()
        return None

    def delete_render(self, render_id: str, mode: Optional[str] = None) -> bool:
        """Delete render image + metadata files. Returns True if found."""
        modes_to_scan = [mode] if mode and mode in VALID_MODES else VALID_MODES
        deleted = False
        for m in modes_to_scan:
            mode_dir = self.base_dir / m
            if not mode_dir.exists():
                continue
            for f in list(mode_dir.glob(f"*_{render_id}.*")):
                f.unlink(missing_ok=True)
                deleted = True
        return deleted

    def clear_mode(self, mode: str) -> int:
        """Delete all renders for a specific mode. Returns count of renders deleted."""
        if mode not in VALID_MODES:
            return 0
        mode_dir = self.base_dir / mode
        if not mode_dir.exists():
            return 0
        count = 0
        for f in list(mode_dir.glob("*.json")):
            f.unlink(missing_ok=True)
            count += 1
        for f in list(mode_dir.glob("*.png")):
            f.unlink(missing_ok=True)
        return count  # count = number of renders (json files)

    def get_stats(self) -> Dict:
        """Return stats: total renders and per-mode counts."""
        stats = {"total": 0, "by_mode": {}}
        for m in VALID_MODES:
            mode_dir = self.base_dir / m
            if not mode_dir.exists():
                stats["by_mode"][m] = 0
                continue
            count = len(list(mode_dir.glob("*.json")))
            stats["by_mode"][m] = count
            stats["total"] += count
        return stats
