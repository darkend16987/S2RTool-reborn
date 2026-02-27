"""
api/render.py - Main Render Endpoint
✅ FIX: Re-translates form_data_vi to include user edits
✅ FIX: Thread-safe instances to prevent race conditions
"""

from flask import Blueprint, request, jsonify
import base64
import io

from core.thread_local import (
    get_image_processor,
    get_prompt_builder,
    get_gemini_client,
    get_translator
)

render_bp = Blueprint('render', __name__)


@render_bp.route('/render', methods=['POST'])
def render_image():
    """
    Main render endpoint

    ✅ FIX: Now accepts form_data_vi and re-translates to include user edits

    Request:
    {
        "image_base64": "...",
        "form_data_vi": {...},  # ✅ CHANGED: Vietnamese form with user edits
        "aspect_ratio": "16:9",
        "viewpoint": "main_facade",
        "reference_image_base64": "..." (optional)
    }

    Response:
    {
        "generated_image_base64": "...",
        "mime_type": "image/png",
        "aspect_ratio": "16:9",
        "viewpoint": "main_facade"
    }
    """
    try:
        # ✅ FIX: Get thread-local instances (prevents race conditions)
        processor = get_image_processor()
        prompt_builder = get_prompt_builder()
        gemini = get_gemini_client()
        translator = get_translator()

        data = request.json

        # ✅ FIX: Accept form_data_vi instead of translated_data_en
        required = ['image_base64', 'form_data_vi', 'aspect_ratio']
        if not all(k in data for k in required):
            return jsonify({"error": f"Missing required fields: {required}"}), 400

        # Process sketch image
        sketch_pil, _ = processor.process_base64_image(data['image_base64'])
        if not sketch_pil:
            return jsonify({"error": "Invalid sketch image"}), 400
        
        # Detect and preprocess
        sketch_info = processor.detect_sketch_type(sketch_pil)
        # ✅ OPTIMIZED: Use preserve_quality=True to minimize quality loss
        preprocessed = processor.preprocess_sketch(
            sketch_pil,
            target_aspect_ratio=data['aspect_ratio'],
            sketch_info=sketch_info,
            preserve_quality=True  # ✅ NEW: Preserve maximum quality
        )
        
        # Process reference image (optional)
        reference_pil = None
        if 'reference_image_base64' in data:
            reference_pil, _ = processor.process_base64_image(data['reference_image_base64'])
        
        # ✅ FIX: RE-TRANSLATE form_data_vi to include user edits!
        # ✅ NEW: Pass render_mode to translator
        render_mode = data.get('render_mode', 'building')  # Get mode early for translation
        print(f"🔄 Re-translating form_data_vi with user edits (mode: {render_mode})...")
        form_data_vi = data['form_data_vi']

        try:
            translated_data_en = translator.translate_vi_to_en(form_data_vi, mode=render_mode)
            print(f"✅ Translation successful!")
            if render_mode == 'interior':
                print(f"   Room type: {translated_data_en.get('room_type', 'N/A')}")
                print(f"   Furniture items: {len(translated_data_en.get('furniture_layout', []))}")
            else:
                print(f"   Lighting: {translated_data_en.get('technical_specs', {}).get('lighting', 'N/A')}")
                print(f"   Environment items: {len(translated_data_en.get('environment', []))}")
        except Exception as e:
            print(f"❌ Translation failed: {e}")
            return jsonify({"error": f"Translation failed: {str(e)}"}), 500
        
        # Build prompt from FRESH translation (with user edits!)
        viewpoint = data.get('viewpoint', 'match_sketch')  # ✅ FIX: Default to match sketch angle
        aspect_ratio = data.get('aspect_ratio', '16:9')

        # ✅ FIX: Extract sketch_adherence from form_data_vi (user-controlled!)
        sketch_adherence = form_data_vi.get('sketch_adherence', 0.95)

        # ✅ NEW: Check if refine instruction provided
        refine_instruction = data.get('refine_instruction', None)

        print(f"🎯 Geometry control: sketch_adherence={sketch_adherence}, aspect_ratio={aspect_ratio}")

        # ✅ NEW: If refine instruction provided, use simplified refine prompt
        if refine_instruction:
            print(f"🔧 REFINE MODE: Using simplified prompt override")
            print(f"   Instruction: {refine_instruction}")
            prompt, negative_prompt = prompt_builder.build_refine_prompt(
                refine_instruction=refine_instruction,
                translated_data_en=translated_data_en,
                aspect_ratio=aspect_ratio,
                render_mode=render_mode
            )
        else:
            # ✅ FIX: Route to correct prompt builder based on render_mode
            # (render_mode already extracted earlier for translation)
            if render_mode == 'interior':
                print("🛋️ Using INTERIOR render prompt builder")
                prompt, negative_prompt = prompt_builder.build_interior_render_prompt(
                    translated_data_en=translated_data_en,
                    viewpoint=viewpoint,
                    has_reference=(reference_pil is not None),
                    sketch_adherence=sketch_adherence,
                    aspect_ratio=aspect_ratio
                )
            else:
                print("🏢 Using BUILDING render prompt builder")
                prompt, negative_prompt = prompt_builder.build_render_prompt(
                    translated_data_en=translated_data_en,
                    viewpoint=viewpoint,
                    has_reference=(reference_pil is not None),
                    sketch_adherence=sketch_adherence,
                    aspect_ratio=aspect_ratio
                )
        
        print(f"📝 Prompt preview (first 200 chars):")
        print(f"   {prompt[:200]}...")
        
        # Generate image
        generated_pil = gemini.generate_image(
            prompt=prompt,
            source_image=preprocessed,
            reference_image=reference_pil,
            temperature=0.4
        )
        
        if not generated_pil:
            return jsonify({"error": "Image generation failed"}), 500

        # Auto-save to render history (best-effort, non-blocking)
        try:
            from core.history_manager import HistoryManager
            hm = HistoryManager()
            if render_mode == 'interior':
                summary = f"{form_data_vi.get('room_type', '')} | {form_data_vi.get('interior_style', '')}"
            else:
                summary = f"{form_data_vi.get('building_type', '')} | {form_data_vi.get('facade_style', '')}"
            hm.save_render(
                image_pil=generated_pil,
                mode=render_mode,
                prompt_summary=summary,
                source_image_pil=preprocessed,
                settings={"aspect_ratio": data['aspect_ratio'], "viewpoint": viewpoint}
            )
        except Exception as he:
            print(f"⚠️  History save failed (non-critical): {he}")

        # Convert to base64
        output_buffer = io.BytesIO()
        generated_pil.save(output_buffer, format='PNG', quality=95)
        output_base64 = base64.b64encode(output_buffer.getvalue()).decode('utf-8')

        return jsonify({
            "generated_image_base64": output_base64,
            "mime_type": "image/png",
            "aspect_ratio": data['aspect_ratio'],
            "viewpoint": viewpoint
        })
        
    except Exception as e:
        print(f"Render error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500