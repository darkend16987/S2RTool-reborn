"""
api/history.py - Render History API Endpoints

Endpoints:
  GET  /api/history/list?mode=&page=&limit=   - List renders
  GET  /api/history/detail/<id>               - Get full metadata
  GET  /api/history/image/<id>               - Download PNG
  GET  /api/history/stats                    - Get render counts
  DELETE /api/history/delete/<id>            - Delete a render
  DELETE /api/history/clear?mode=            - Clear all in a mode
"""

import io
from flask import Blueprint, request, jsonify, send_file

from core.history_manager import HistoryManager

history_bp = Blueprint("history", __name__)

# Module-level singleton (safe: file-based, no shared mutable state)
_history_manager: HistoryManager = None


def get_history_manager() -> HistoryManager:
    global _history_manager
    if _history_manager is None:
        _history_manager = HistoryManager()
    return _history_manager


@history_bp.route("/history/list", methods=["GET"])
def list_history():
    """GET /api/history/list?mode=interior&page=1&limit=20"""
    mode = request.args.get("mode") or None
    try:
        page = max(1, int(request.args.get("page", 1)))
        limit = min(100, max(1, int(request.args.get("limit", 20))))
    except ValueError:
        return jsonify({"error": "Invalid page/limit"}), 400

    result = get_history_manager().list_renders(mode=mode, page=page, limit=limit)
    return jsonify(result)


@history_bp.route("/history/detail/<render_id>", methods=["GET"])
def get_detail(render_id: str):
    """GET /api/history/detail/<render_id>"""
    mode = request.args.get("mode") or None
    detail = get_history_manager().get_render_detail(render_id, mode=mode)
    if not detail:
        return jsonify({"error": "Not found"}), 404
    return jsonify(detail)


@history_bp.route("/history/image/<render_id>", methods=["GET"])
def get_image(render_id: str):
    """GET /api/history/image/<render_id> - Returns PNG for download"""
    mode = request.args.get("mode") or None
    image_bytes = get_history_manager().get_render_image_bytes(render_id, mode=mode)
    if not image_bytes:
        return jsonify({"error": "Not found"}), 404
    return send_file(
        io.BytesIO(image_bytes),
        mimetype="image/png",
        as_attachment=True,
        download_name=f"render_{render_id}.png"
    )


@history_bp.route("/history/stats", methods=["GET"])
def get_stats():
    """GET /api/history/stats"""
    return jsonify(get_history_manager().get_stats())


@history_bp.route("/history/delete/<render_id>", methods=["DELETE"])
def delete_render(render_id: str):
    """DELETE /api/history/delete/<render_id>"""
    mode = request.args.get("mode") or None
    deleted = get_history_manager().delete_render(render_id, mode=mode)
    if not deleted:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"success": True, "id": render_id})


@history_bp.route("/history/clear", methods=["DELETE"])
def clear_history():
    """DELETE /api/history/clear?mode=interior"""
    mode = request.args.get("mode")
    if not mode:
        return jsonify({"error": "mode parameter is required"}), 400
    count = get_history_manager().clear_mode(mode)
    return jsonify({"success": True, "mode": mode, "deleted": count})
