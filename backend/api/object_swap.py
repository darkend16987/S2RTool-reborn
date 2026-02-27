"""
api/object_swap.py - Object Swap Endpoint

POST /api/object-swap/render
  Replaces an object/area in a scene using mask-based approach (1.2):
  - source_image: original scene
  - mask_image: binary mask (white = replace, black = preserve)
  - reference_object_image: photo of new object (optional)
  - swap_instruction: text description
  - preserve_mode: hybrid (default) | strict | gemini_only
  - aspect_ratio: for source resize (default: preserve original)

Response: { "result_image_base64": "...", "mime_type": "image/png" }
"""

import base64
import io
from flask import Blueprint, request, jsonify

from core.thread_local import get_image_processor, get_gemini_client
from core.object_swap_engine import ObjectSwapEngine
from core.history_manager import HistoryManager

object_swap_bp = Blueprint('object_swap', __name__)


def _get_engine():
    """Get ObjectSwapEngine with thread-local gemini client."""
    gemini = get_gemini_client()
    return ObjectSwapEngine(gemini_client=gemini)


@object_swap_bp.route('/object-swap/render', methods=['POST'])
def object_swap_render():
    """
    Object swap endpoint.

    Request JSON:
    {
        "source_image_base64": "data:image/png;base64,...",
        "mask_image_base64": "data:image/png;base64,...",
        "reference_object_base64": "data:image/png;base64,..." (optional),
        "swap_instruction": "Replace with modern Scandinavian sofa" (optional),
        "preserve_mode": "hybrid" (optional: hybrid|strict|gemini_only)
    }
    """
    try:
        processor = get_image_processor()
        data = request.json

        # Validate required fields
        required = ['source_image_base64', 'mask_image_base64']
        if not all(k in data for k in required):
            return jsonify({"error": f"Missing required fields: {required}"}), 400

        # Process source image
        source_pil, _ = processor.process_base64_image(data['source_image_base64'])
        if not source_pil:
            return jsonify({"error": "Invalid source image"}), 400

        # Process mask image
        mask_pil, _ = processor.process_base64_image(data['mask_image_base64'])
        if not mask_pil:
            return jsonify({"error": "Invalid mask image"}), 400

        # Ensure mask matches source dimensions
        if mask_pil.size != source_pil.size:
            mask_pil = mask_pil.resize(source_pil.size)

        # Process reference object (optional)
        reference_pil = None
        if data.get('reference_object_base64'):
            reference_pil, _ = processor.process_base64_image(data['reference_object_base64'])

        swap_instruction = data.get('swap_instruction', '')
        preserve_mode = data.get('preserve_mode', 'hybrid')

        print(f"🔄 Object Swap request:")
        print(f"   Source: {source_pil.size}")
        print(f"   Mask: {mask_pil.size}")
        print(f"   Reference: {'Yes' if reference_pil else 'No (text only)'}")
        print(f"   Instruction: {swap_instruction[:80]}")
        print(f"   Preserve mode: {preserve_mode}")

        # Resize source for processing (max 2048)
        source_resized = processor.resize_image(source_pil, max_size=2048)
        mask_resized = mask_pil.resize(source_resized.size) if mask_pil.size != source_resized.size else mask_pil

        # Run engine
        engine = _get_engine()
        result_pil = engine.swap_object(
            source_image=source_resized,
            mask_image=mask_resized,
            reference_object=reference_pil,
            swap_instruction=swap_instruction,
            preserve_mode=preserve_mode
        )

        # Auto-save to history
        try:
            hm = HistoryManager()
            summary = swap_instruction[:150] if swap_instruction else "Object swap"
            hm.save_render(
                image_pil=result_pil,
                mode="object_swap",
                prompt_summary=summary,
                source_image_pil=source_resized,
                settings={"preserve_mode": preserve_mode, "has_reference": reference_pil is not None}
            )
        except Exception as he:
            print(f"⚠️  History save failed (non-critical): {he}")

        # Convert to base64
        out_buf = io.BytesIO()
        result_pil.save(out_buf, format='PNG')
        result_b64 = base64.b64encode(out_buf.getvalue()).decode('utf-8')

        return jsonify({
            "result_image_base64": result_b64,
            "mime_type": "image/png"
        })

    except Exception as e:
        print(f"❌ Object Swap error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
