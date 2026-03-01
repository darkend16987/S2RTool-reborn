"""
api/floorplan.py - 2D Floor Plan Material/Color Render Endpoints

POST /api/floorplan/analyze  - AI analysis of floor plan image
POST /api/floorplan/render   - Render materials/colors onto floor plan
"""

import base64
import io
from flask import Blueprint, request, jsonify

from core.thread_local import get_image_processor, get_gemini_client, get_prompt_builder
from core.history_manager import HistoryManager
from config import Models, FloorPlanConfig

floorplan_bp = Blueprint('floorplan', __name__)


@floorplan_bp.route('/floorplan/analyze', methods=['POST'])
def analyze_floorplan():
    """
    Analyze a 2D floor plan image using AI (Vietnamese output).

    Request:
    {
        "image_base64": "data:image/png;base64,..."
    }

    Response:
    {
        "analysis": {
            "apartment_type": "...",
            "overall_size": "...",
            "rooms": [...],
            "special_zones": {...},
            "doors_windows": {...}
        }
    }
    """
    try:
        processor = get_image_processor()
        gemini = get_gemini_client()
        prompt_builder = get_prompt_builder()

        data = request.json
        if 'image_base64' not in data:
            return jsonify({"error": "Missing image_base64"}), 400

        # Process image
        image_pil, _ = processor.process_base64_image(data['image_base64'])
        if not image_pil:
            return jsonify({"error": "Invalid image"}), 400

        image_pil = processor.resize_image(image_pil, max_size=2048)

        print(f"🔍 Analyzing floor plan...")

        # Build analysis prompt
        analysis_prompt = prompt_builder.build_floorplan_analysis_prompt()

        # Call Gemini (text/JSON output)
        analysis = gemini.generate_content_json(
            prompt_parts=[analysis_prompt, image_pil],
            model_name=Models.PRO,
            temperature=FloorPlanConfig.TEMPERATURE_ANALYSIS
        )

        print(f"✅ Floor plan analyzed: {analysis.get('total_rooms', '?')} rooms detected")

        return jsonify({"analysis": analysis})

    except Exception as e:
        print(f"❌ Floor plan analysis error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@floorplan_bp.route('/floorplan/render', methods=['POST'])
def render_floorplan():
    """
    Render materials/colors onto a 2D floor plan.

    Request:
    {
        "image_base64": "data:image/png;base64,...",
        "analysis_data": { ... },   # from /api/floorplan/analyze (user may have edited)
        "style": "modern",          # optional: modern|tropical|industrial|...
        "color_scheme": "...",      # optional: text description of color preferences
        "aspect_ratio": "1:1",      # optional: default 1:1
        "reference_image_base64": "..." # optional: style reference
    }

    Response:
    {
        "generated_image_base64": "...",
        "mime_type": "image/png"
    }
    """
    try:
        processor = get_image_processor()
        gemini = get_gemini_client()
        prompt_builder = get_prompt_builder()

        data = request.json

        required = ['image_base64', 'analysis_data']
        if not all(k in data for k in required):
            return jsonify({"error": f"Missing required fields: {required}"}), 400

        # Process source floor plan
        image_pil, _ = processor.process_base64_image(data['image_base64'])
        if not image_pil:
            return jsonify({"error": "Invalid floor plan image"}), 400

        image_pil = processor.resize_image(image_pil, max_size=2048)

        # Process reference image (optional)
        reference_pil = None
        if data.get('reference_image_base64'):
            reference_pil, _ = processor.process_base64_image(data['reference_image_base64'])

        # Extract parameters
        analysis_data = data['analysis_data']
        style = data.get('style', FloorPlanConfig.DEFAULT_STYLE)
        color_scheme = data.get('color_scheme', '')
        aspect_ratio = data.get('aspect_ratio', FloorPlanConfig.DEFAULT_ASPECT_RATIO)
        technical_specs = data.get('technical_specs', None)

        print(f"🏠 Rendering floor plan:")
        print(f"   Type: {analysis_data.get('apartment_type', 'N/A')}")
        print(f"   Rooms: {len(analysis_data.get('rooms', []))}")
        print(f"   Style: {style}")
        print(f"   Aspect ratio: {aspect_ratio}")
        print(f"   Reference: {'Yes' if reference_pil else 'No'}")

        # Build render prompt
        render_prompt = prompt_builder.build_floorplan_render_prompt(
            analysis_data=analysis_data,
            style=style,
            color_scheme=color_scheme,
            has_reference=(reference_pil is not None),
            aspect_ratio=aspect_ratio,
            technical_specs=technical_specs
        )

        print(f"📝 Prompt preview: {render_prompt[:200]}...")

        # Generate image (source = floor plan, reference = style ref if any)
        generated_pil = gemini.generate_image(
            prompt=render_prompt,
            source_image=image_pil,
            reference_image=reference_pil,
            temperature=FloorPlanConfig.TEMPERATURE_RENDER
        )

        if not generated_pil:
            return jsonify({"error": "Floor plan render generation failed"}), 500

        # Auto-save to history
        try:
            hm = HistoryManager()
            apt = analysis_data.get('apartment_type', '')
            summary = f"{apt} | {style} | {color_scheme[:80]}" if color_scheme else f"{apt} | {style}"
            hm.save_render(
                image_pil=generated_pil,
                mode="floorplan",
                prompt_summary=summary,
                source_image_pil=image_pil,
                settings={"style": style, "aspect_ratio": aspect_ratio}
            )
        except Exception as he:
            print(f"⚠️  History save failed (non-critical): {he}")

        # Convert to base64
        out_buf = io.BytesIO()
        generated_pil.save(out_buf, format='PNG', quality=95)
        result_b64 = base64.b64encode(out_buf.getvalue()).decode('utf-8')

        print("✅ Floor plan render complete")

        return jsonify({
            "generated_image_base64": result_b64,
            "mime_type": "image/png",
            "aspect_ratio": aspect_ratio
        })

    except Exception as e:
        print(f"❌ Floor plan render error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
