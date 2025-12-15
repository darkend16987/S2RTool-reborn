"""
api/analyze_interior.py - Interior Sketch Analysis Endpoint
Analyzes interior design sketches and returns detailed Vietnamese description
"""

from flask import Blueprint, request, jsonify
import io

from core.thread_local import (
    get_image_processor,
    get_prompt_builder,
    get_gemini_client,
    get_analysis_cache
)
from config import Models

analyze_interior_bp = Blueprint('analyze_interior', __name__)


@analyze_interior_bp.route('/analyze-sketch-interior', methods=['POST'])
def analyze_sketch_interior():
    """
    Analyze interior sketch and return Vietnamese description

    Request:
    {
        "image_base64": "..."
    }

    Response:
    {
        "room_type": "...",
        "interior_style": "...",
        "furniture_layout": [...],
        "wall_treatments": [...],
        "flooring": {...},
        "ceiling": {...},
        "lighting": [...],
        "decorations": [...],
        "windows_doors": [...],
        "environment": [...],
        "technical_specs": {...}
    }
    """
    try:
        # Get thread-local instances (prevents race conditions)
        processor = get_image_processor()
        prompt_builder = get_prompt_builder()
        gemini = get_gemini_client()
        cache = get_analysis_cache()

        data = request.json

        if 'image_base64' not in data:
            return jsonify({"error": "Missing image_base64"}), 400

        # Process image
        pil_image, _ = processor.process_base64_image(data['image_base64'])
        if not pil_image:
            return jsonify({"error": "Invalid image"}), 400

        # Detect sketch type
        sketch_info = processor.detect_sketch_type(pil_image)

        # Resize to 2048 to preserve maximum detail for analysis
        pil_image = processor.resize_image(pil_image, max_size=2048)

        # Convert image to bytes for cache lookup
        img_byte_arr = io.BytesIO()
        pil_image.save(img_byte_arr, format='PNG')
        image_bytes = img_byte_arr.getvalue()

        # Check cache first (with interior-specific cache key)
        cache_key = b'interior:' + image_bytes
        cached_result = cache.get(cache_key)
        if cached_result:
            # Add fresh sketch detection info (not cached)
            cached_result['sketch_detail_level'] = sketch_info.detail_level
            cached_result['is_colored'] = sketch_info.is_colored
            cached_result['sketch_type'] = sketch_info.sketch_type

            print("✅ Returning cached interior analysis result")
            return jsonify(cached_result)

        # CACHE MISS: Analyze with Gemini using interior prompt
        print("🔍 Cache miss - calling Gemini API for interior analysis...")
        interior_analysis_prompt = prompt_builder.build_interior_analysis_prompt()

        analysis_result = gemini.generate_content_json(
            prompt_parts=[interior_analysis_prompt, pil_image],
            model_name=Models.PRO,
            temperature=0.3
        )

        # Store in cache with interior-specific key
        cache.set(cache_key, analysis_result.copy())

        # Add sketch detection info
        analysis_result['sketch_detail_level'] = sketch_info.detail_level
        analysis_result['is_colored'] = sketch_info.is_colored
        analysis_result['sketch_type'] = sketch_info.sketch_type

        return jsonify(analysis_result)

    except Exception as e:
        print(f"❌ [ANALYZE_INTERIOR_ERROR] {str(e)}")
        import traceback
        traceback.print_exc()

        return jsonify({"error": str(e)}), 500
