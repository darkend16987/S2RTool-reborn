"""
core/prompt_builder.py - Prompt Engineering & Templates
"""

from typing import Dict, List, Optional, Tuple
from config import CAMERA_VIEWPOINTS, DEFAULT_NEGATIVE_ITEMS


class PromptBuilder:
    """Build optimized prompts for Gemini"""
    
    # ============== RENDER PROMPTS ==============
    
    RENDER_WITH_REFERENCE = """
**ROLE**: You are an expert AI architectural renderer specializing in photorealistic transformations.

**CRITICAL INSTRUCTIONS**:

You are given TWO images in this exact order:
1. **Structural Sketch** (Image 1): Architectural drawing showing form, proportions, and layout
2. **Style Reference** (Image 2): Photo providing style, lighting, materials, and atmosphere

**YOUR TASK - Follow these rules STRICTLY**:

1. **PRESERVE GEOMETRY** (Priority 1 - ABSOLUTE REQUIREMENT):
   ⚠️ SKETCH ADHERENCE LEVEL: {sketch_adherence} (0.5=flexible, 1.0=pixel-perfect)
   🏢 **BUILDING HAS EXACTLY {floor_count} - THIS IS NON-NEGOTIABLE!**
   ✓ Maintain EXACT proportions from sketch (±2% tolerance maximum)
   ✓ Keep ALL window/door positions UNCHANGED
   ✓ Preserve overall building silhouette PERFECTLY
   ✓ Preserve the EXACT NUMBER OF FLOORS visible in the sketch
   ✓ White padding around sketch is TECHNICAL ARTIFACT - ignore it, do NOT extend building into it
   ✗ DO NOT copy building shapes from reference image
   ✗ DO NOT alter building width/height ratios
   ✗ DO NOT change structural proportions to "improve" composition
   ✗ DO NOT add or remove floors to "improve" the design

2. **ADOPT STYLE** (Priority 2):
   ✓ Study reference lighting conditions carefully
   ✓ Apply its color palette and mood
   ✓ Use its material textures (concrete, wood, glass qualities)
   ✓ Replicate environmental context (vegetation, sky, atmosphere)

3. **ENHANCE REALISM** (Priority 3):
   ✓ Add photographic depth of field
   ✓ Include natural shadows and reflections
   ✓ Apply subtle weathering and imperfections
   ✓ Ensure materials look tangible

4. **OUTPUT FORMAT**:
   ✓ Aspect ratio: {aspect_ratio}
   ✓ Single photorealistic image
   ✗ No text, watermarks, or overlays

5. **USER'S SPECIFIC REQUEST**:
   {user_description}

6. **VIEWPOINT SPECIFICATION** (CAMERA ANGLE):
   {viewpoint_instruction}
   ⚠️ This viewpoint overrides any camera angle mentioned in technical specs below

7. **TECHNICAL SPECIFICATIONS**:
   Camera: {camera}
   Lens: {lens}
   Lighting: {lighting}
   Materials: {materials}

8. **ENVIRONMENT & CONTEXT** (CRITICAL - Include ALL of these):
   {environment}

9. **CRITICAL EXCLUSIONS** - DO NOT include any of these:
   {negative_items}

**OUTPUT**: Single photorealistic architectural photograph matching {aspect_ratio} aspect ratio, no text/watermarks
"""

    RENDER_WITHOUT_REFERENCE = """
**ROLE**: You are an expert AI architectural renderer.

**INPUT**: One architectural sketch showing building form and proportions

**YOUR TASK**:

1. **PRESERVE STRUCTURE** (ABSOLUTE REQUIREMENT):
   ⚠️ SKETCH ADHERENCE LEVEL: {sketch_adherence} (0.5=flexible, 1.0=pixel-perfect)
   🏢 **BUILDING HAS EXACTLY {floor_count} - THIS IS NON-NEGOTIABLE!**
   ✓ Maintain exact proportions from sketch (±2% maximum)
   ✓ Keep all architectural elements in exact positions
   ✓ Preserve the EXACT NUMBER OF FLOORS visible in the sketch
   ✓ White padding around sketch is TECHNICAL ARTIFACT - ignore it, do NOT extend building into it
   ✗ Do not add/remove major features
   ✗ Do NOT alter building width/height ratios
   ✗ Do NOT change structural proportions to fill frame
   ✗ DO NOT add or remove floors to "improve" the design

2. **ADD REALISM**:
   ✓ Infer realistic materials based on building type
   ✓ Apply natural lighting conditions
   ✓ Add appropriate context (trees, sky, ground)
   ✓ Include human scale reference if suitable

3. **OUTPUT FORMAT**:
   ✓ Aspect ratio: {aspect_ratio}
   ✓ Single photorealistic image
   ✗ No text, watermarks, or overlays

4. **USER'S REQUEST**:
   {user_description}

5. **VIEWPOINT SPECIFICATION** (CAMERA ANGLE):
   {viewpoint_instruction}
   ⚠️ This viewpoint overrides any camera angle mentioned in technical specs below

6. **TECHNICAL SPECS**:
   Camera: {camera}
   Lens: {lens}
   Lighting: {lighting}
   Materials: {materials}

7. **ENVIRONMENT & CONTEXT** (CRITICAL - Include ALL of these):
   {environment}

8. **AVOID THESE**:
   {negative_items}

**OUTPUT**: Single photorealistic architectural photograph matching {aspect_ratio} aspect ratio
Style: Professional architectural photography (ArchDaily quality)
"""

    # ============== INPAINTING PROMPTS ==============
    
    INPAINT_WITH_REFERENCE = """
**CRITICAL INPAINTING DIRECTIVE WITH STYLE REFERENCE**

You are performing high-fidelity inpainting. Adherence to mask and style is HIGHEST priority.

**INPUT IMAGES (in order)**:
1. **Original Image**: Base image to modify
2. **Mask Image**: Black & white overlay
   - WHITE areas = Edit zone (make changes here)
   - BLACK areas = Protected zone (MUST keep identical)
3. **Style Reference**: Style guidance image

**YOUR TASK**:

1. **FORBIDDEN ZONE**:
   ⚠️ BLACK areas are SACRED - pixels MUST BE IDENTICAL to original
   ⚠️ Any change in black region = FAILURE

2. **USER'S EDIT REQUEST**:
   {edit_instruction}

3. **STYLE APPLICATION**:
   ✓ Adopt style, texture, lighting from reference image
   ✓ Apply to WHITE mask area only
   ✗ Do NOT copy shapes from reference

4. **QUALITY REQUIREMENTS**:
   ✓ Seamless transitions at mask edges
   ✓ Match surrounding lighting/color
   ✓ Photorealistic integration
   ✓ Natural shadows and reflections

**OUTPUT**: Single edited image (white area changed, black area preserved)
"""

    INPAINT_WITHOUT_REFERENCE = """
**CRITICAL INPAINTING DIRECTIVE**

**INPUT IMAGES**:
1. Original image
2. Mask image (black & white)

**STRICT RULES**:

1. **PRIMARY RULE**: 
   Modifications STRICTLY confined to WHITE area of mask

2. **FORBIDDEN ZONE**: 
   BLACK area = NO-CHANGE ZONE
   Pixels MUST BE IDENTICAL to original

3. **USER'S REQUEST**:
   {edit_instruction}

4. **FINAL OUTPUT**: 
   Single image with seamless edit in white area
   Black area perfectly preserved

**OUTPUT**: Edited image with natural transitions
"""

    # ============== INTERIOR RENDER PROMPTS ==============

    INTERIOR_RENDER_WITH_REFERENCE = """
**ROLE**: You are an expert AI interior design renderer and ArchViz artist specializing in photorealistic interior visualizations.

**CRITICAL INSTRUCTIONS**:

You are given TWO images in this exact order:
1. **Interior Sketch** (Image 1): Interior design drawing showing room layout, furniture positions, and spatial relationships
2. **Style Reference** (Image 2): Photo providing style, lighting, materials, textures, and atmosphere

**YOUR TASK - Follow these rules STRICTLY**:

1. **PRESERVE SPATIAL LAYOUT** (Priority 1 - ABSOLUTE REQUIREMENT):
   ⚠️ SKETCH ADHERENCE LEVEL: {sketch_adherence} (0.95=very strict, 1.0=pixel-perfect)
   🛋️ **MAINTAIN EXACT POSITIONS OF ALL FURNITURE AND OBJECTS - THIS IS NON-NEGOTIABLE!**
   ✓ Keep EXACT position of every furniture item (sofa, tables, chairs, cabinets, etc.)
   ✓ Preserve EXACT spatial relationships between objects (distances, alignments, groupings)
   ✓ Maintain EXACT proportions and scales of all objects relative to each other
   ✓ Preserve room dimensions and perspective from sketch
   ✓ Keep wall treatments, floor patterns, and ceiling features in EXACT locations
   ✗ DO NOT move, add, or remove any furniture items
   ✗ DO NOT alter object sizes or proportions to "improve" composition
   ✗ DO NOT change spatial relationships between objects
   ✗ DO NOT reorganize furniture layout

2. **PRESERVE OBJECT IDENTITY** (Priority 2 - CRITICAL):
   ✓ Maintain the ESSENCE and FORM of each object (round table stays round, L-shaped sofa stays L-shaped)
   ✓ Keep chair types, table shapes, cabinet styles as sketched
   ✓ Preserve decorative items (paintings, sculptures, plants, books, vases) in exact positions
   ✗ DO NOT transform object types (don't change sofa to loveseat, round table to square, etc.)

3. **MATERIAL ACCURACY** (Priority 3 - VERY IMPORTANT):
   ✓ Apply materials exactly as described: {materials_description}
   ✓ For multi-material walls (backdrop walls), preserve LEFT-TO-RIGHT order of materials
   ✓ Match floor type and rug placement precisely
   ✓ Apply correct ceiling treatments and lighting systems

4. **ADOPT STYLE FROM REFERENCE** (Priority 4):
   ✓ Study reference lighting conditions (color temperature, intensity, direction)
   ✓ Apply its material textures and finishes (fabric weaves, wood grains, stone veining, metal polish)
   ✓ Replicate atmospheric mood and color palette
   ✗ DO NOT copy furniture shapes or layouts from reference

5. **LIGHTING EMPHASIS** (Priority 5 - CRITICAL):
   {lighting_description}
   ✓ Distinguish clearly between PRIMARY lighting (main source) and SECONDARY/ACCENT lighting
   ✓ Apply contrast, shadow, and highlight adjustments as specified
   ✓ Create dramatic lighting effects if specified (high contrast, deep shadows, crisp highlights)

6. **ENHANCE REALISM** (Priority 6):
   ✓ Add photographic depth of field
   ✓ Include realistic shadows and reflections
   ✓ Show material textures in ultra-sharp detail (fabric weaves, wood pores, stone veins)
   ✓ Apply specified sharpness and contrast boosts: {technical_enhancements}

7. **OUTPUT FORMAT**:
   ✓ Aspect ratio: {aspect_ratio}
   ✓ Camera viewpoint: {viewpoint}
   ✓ Single photorealistic interior photograph
   ✗ No text, watermarks, or overlays

8. **USER'S SPECIFIC REQUEST**:
   Room Type: {room_type}
   Style: {interior_style}
   {user_description}

9. **ENVIRONMENT & ATMOSPHERE**:
   {environment}

10. **CRITICAL EXCLUSIONS** - DO NOT include any of these:
    {negative_items}

**OUTPUT**: Single photorealistic interior photograph matching {aspect_ratio} aspect ratio, professional interior photography quality (AD/Architectural Digest standard), no text/watermarks
"""

    INTERIOR_RENDER_WITHOUT_REFERENCE = """
**ROLE**: You are an expert AI interior design renderer and ArchViz artist.

**INPUT**: One interior design sketch showing room layout and furniture placement

**YOUR TASK**:

1. **PRESERVE SPATIAL LAYOUT** (ABSOLUTE REQUIREMENT - Priority 1):
   ⚠️ SKETCH ADHERENCE LEVEL: {sketch_adherence} (0.95=very strict, 1.0=pixel-perfect)
   🛋️ **MAINTAIN EXACT POSITIONS OF ALL FURNITURE AND OBJECTS - THIS IS NON-NEGOTIABLE!**
   ✓ Keep EXACT position of every furniture item from sketch
   ✓ Preserve EXACT spatial relationships (distances, alignments, groupings)
   ✓ Maintain EXACT proportions and scales of all objects relative to each other
   ✓ Preserve room dimensions and perspective
   ✓ Keep wall treatments, floor patterns, ceiling features in EXACT locations
   ✗ DO NOT move, add, or remove any furniture or decorative items
   ✗ DO NOT alter object sizes or proportions
   ✗ DO NOT reorganize furniture layout

2. **PRESERVE OBJECT IDENTITY** (Priority 2):
   ✓ Maintain the ESSENCE and FORM of each object (shapes, types, styles)
   ✓ Keep all decorative items (paintings, sculptures, plants, books) in exact positions
   ✗ DO NOT transform object types

3. **MATERIAL ACCURACY** (Priority 3):
   ✓ Apply materials exactly as described: {materials_description}
   ✓ For multi-material walls, preserve material order and layout
   ✓ Match floor, rug, and ceiling treatments precisely

4. **LIGHTING EMPHASIS** (Priority 4 - CRITICAL):
   {lighting_description}
   ✓ Implement PRIMARY vs SECONDARY lighting hierarchy
   ✓ Apply contrast, shadow, and highlight adjustments
   ✓ Create specified lighting effects

5. **ADD REALISM** (Priority 5):
   ✓ Infer photorealistic materials based on room type and style
   ✓ Apply natural lighting and shadows
   ✓ Show ultra-sharp material details: {technical_enhancements}
   ✓ Add appropriate atmosphere and mood

6. **OUTPUT FORMAT**:
   ✓ Aspect ratio: {aspect_ratio}
   ✓ Camera viewpoint: {viewpoint}
   ✓ Single photorealistic image
   ✗ No text, watermarks, or overlays

7. **USER'S REQUEST**:
   Room Type: {room_type}
   Style: {interior_style}
   {user_description}

8. **ENVIRONMENT & ATMOSPHERE**:
   {environment}

9. **AVOID THESE**:
   {negative_items}

**OUTPUT**: Single photorealistic interior photograph matching {aspect_ratio} aspect ratio
Style: Professional interior photography (Architectural Digest / AD quality)
"""

    # ============== PLANNING MODE PROMPTS ==============

    # DYNAMIC PROMPT CONSTRUCTION IS BETTER THAN STATIC TEMPLATES
    PLANNING_DETAIL_CORE = """
**ROLE**: You are an expert AI urban planning visualization specialist.

**CRITICAL CONTEXT**: This is SKETCH-TO-RENDER for detailed planning. The sketch shows EXISTING BUILDINGS already drawn. You must TRANSFORM the sketch into photorealistic render while PRESERVING shapes, proportions, and layout precisely.

**INPUT**: Planning sketch showing multiple buildings/structures already drawn

**YOUR TASK - Transform Sketch to Photorealistic Render**:

1. **PRESERVE SHAPES & PROPORTIONS** (Priority 1 - ABSOLUTE REQUIREMENT):
   ⚠️ This is the MOST CRITICAL requirement!
   ✓ Maintain EXACT building shapes from sketch (±3% tolerance max)
   ✓ Preserve EXACT building-to-building scale ratios
   ✓ Respect all lot boundaries and setbacks shown
   ✗ DO NOT alter building shapes to "improve" design
   ✗ DO NOT merge or split buildings
   🚨 **ANTI-HALLUCINATION**: ONLY render buildings CLEARLY DRAWN in the sketch. Empty spaces must remain open (parks, plazas).

2. **PLANNING DESCRIPTION**:
   {planning_description}

3. **CAMERA, HORIZON & COMPOSITION**:
   Camera Angle: {camera_angle}
   **Horizon Line**: {horizon_line}
   Aspect Ratio: {aspect_ratio}

4. **TIME & ATMOSPHERE**:
   Time: {time_of_day}
   Weather: {weather}

5. **QUALITY & STYLE**:
   {quality_note}

6. **RENDER EFFECTS**:
   {render_effects}

7. **MATERIALS & DETAILS**:
   {material_details}

8. **URBAN CONTEXT**:
   {context_details}

9. **SKETCH ADHERENCE**:
   Fidelity Level: {sketch_adherence}
   ⚠️ At 0.90+ fidelity, shape preservation is ABSOLUTE.

**OUTPUT**: Photorealistic planning visualization. No text, no watermarks.
"""

    PLANNING_RENDER_PROMPT = """
**ROLE**: You are an expert AI urban planning visualization specialist.

**⚠️ CRITICAL CONTEXT**: This is a GENERATIVE planning task. The Site Plan shows ONLY lot boundaries (empty lots with NO buildings). You must CREATE buildings from scratch based on the lot descriptions below.

**INPUT IMAGES (in order)**:
1. **Site Plan**: Aerial sketch showing ONLY lot boundaries/property lines (EMPTY LOTS - no buildings!)
2. **Lot Map**: Numbered/color-coded map for lot identification

**YOUR TASK - Generate Buildings from Descriptions**:

1. **LOT FIDELITY IS PARAMOUNT** (Priority 1 - ABSOLUTE REQUIREMENT):
   ⚠️ Each lot boundary from images MUST be preserved with 95%+ accuracy
   ⚠️ CRITICAL: Site Plan is EMPTY - you must GENERATE buildings, not transform existing ones
   ✓ Maintain EXACT lot shapes and dimensions from Site Plan
   ✓ Preserve EXACT lot positions relative to each other
   ✓ Keep EXACT lot count (do not merge or split lots)
   ✓ Follow numbered/colored lot identification from Lot Map
   ✓ CREATE buildings WITHIN each lot boundary according to descriptions
   ✗ DO NOT adjust lot boundaries to "improve" layout
   ✗ DO NOT change lot shapes for aesthetic reasons
   ✗ DO NOT merge or split lots
   ✗ DO NOT look for existing buildings in Site Plan (there are NONE - it's pure lot boundaries)

2. **BUILDING GENERATION FROM DESCRIPTIONS** (Priority 2):
   Generate buildings for each lot based on these descriptions:

   {lot_descriptions}

   ⚠️ CRITICAL: Match each lot number to its description precisely
   ⚠️ BUILD FROM SCRATCH - do not copy any buildings (Site Plan has none)
   ✓ Create EXACTLY what is described for each lot
   ✓ Respect floor counts, building types, materials specified
   ✓ Position building centrally within its lot boundary
   ✓ Respect setbacks from lot edges (realistic spacing)
   ✗ DO NOT swap buildings between lots
   ✗ DO NOT improvise building designs beyond descriptions
   ✗ DO NOT create buildings where no description exists

3. **MASSING & SCALE** (Priority 3):
   ✓ Show realistic building masses (height, bulk, footprint)
   ✓ Maintain correct height relationships between lots
   ✓ Show clear lot separations (gaps, boundaries)
   ✓ Respect setbacks and spacing
   ✗ DO NOT exaggerate or minimize building sizes

4. **AERIAL PERSPECTIVE** (Priority 4):
   Camera Angle: {camera_angle}
   ✓ Show entire development from specified aerial view
   ✓ Capture layout relationships clearly
   ✓ Show all lots in one coherent view
   ✓ Ensure lot boundaries are visible and distinguishable

5. **TIME & ATMOSPHERE** (Priority 5):
   Time of Day: {time_of_day}
   ✓ Apply realistic lighting for this time
   ✓ Natural shadows respecting sun angle
   ✓ Atmospheric effects (haze, fog if appropriate)
   ✓ Sky and weather appropriate to time

6. **URBAN CONTEXT & REALISM**:
   ✓ Add streets, roads, pathways between lots
   ✓ Include urban infrastructure (sidewalks, parking)
   ✓ Add landscaping (trees, grass, plazas)
   ✓ Show site entrance/access points
   ✓ Add surrounding context (neighboring buildings if relevant)
   ✓ Include people, vehicles for scale (sized realistically)
   ✓ Show utilities (streetlights, signs) if appropriate

7. **RENDERING QUALITY**:
   ✓ Photorealistic materials (concrete, glass, metal, brick)
   ✓ Accurate reflections (glass facades, water features)
   ✓ Natural depth of field (slight blur for distance)
   ✓ Global illumination (realistic light bouncing)
   ✓ Soft shadows with proper penumbra
   ✓ HDRI sky for realistic lighting
   ✓ Bloom effect on bright surfaces (subtle)

8. **STYLE KEYWORDS** (Optional Enhancements):
   {style_keywords}

9. **OUTPUT FORMAT**:
   ✓ Aspect ratio: {aspect_ratio}
   ✓ Single photorealistic aerial rendering
   ✗ No text labels, lot numbers, or annotations on image
   ✗ No watermarks or overlays

**OUTPUT**: Professional urban planning visualization showing entire development site with all lots rendered according to their specific descriptions, viewed from {camera_angle} at {time_of_day}.

**VERIFICATION CHECKLIST**:
- [ ] All lot boundaries match Lot Map precisely
- [ ] Each lot has building matching its description
- [ ] Lot count matches exactly
- [ ] Layout relationships preserved
- [ ] Aerial perspective is clear and realistic
- [ ] Materials and details are photorealistic
"""

    # ============== PUBLIC METHODS ==============
    
    @classmethod
    def build_render_prompt(
        cls,
        translated_data_en: Dict,
        viewpoint: str = "main_facade",
        has_reference: bool = False,
        negative_items: Optional[List[str]] = None,
        sketch_adherence: float = 0.95,
        aspect_ratio: str = "16:9"
    ) -> Tuple[str, str]:
        """
        Build optimized render prompt

        Args:
            translated_data_en: English structured data
            viewpoint: Camera viewpoint key
            has_reference: Whether reference image is provided
            negative_items: Custom negative items (optional)
            sketch_adherence: How strictly to follow sketch (0.5-1.0, default 0.95)
            aspect_ratio: Target aspect ratio (e.g., "16:9")

        Returns:
            (prompt, negative_prompt_summary)
        """
        # ✅ FIX: Extract data from ACTUAL translation output format
        # Translation outputs: building_type, floor_count, facade_style, materials_precise, environment, technical_specs

        building_type = translated_data_en.get('building_type', 'building')

        # ✅ NEW: Format floor count from integer + optional floor_details
        floor_num = translated_data_en.get('floor_count', 3)
        floor_details = translated_data_en.get('floor_details', '').strip()
        has_mezzanine = translated_data_en.get('has_mezzanine', False)

        # Build clear, unambiguous floor count string
        if isinstance(floor_num, int):
            floor_count = f"EXACTLY {floor_num} {'floor' if floor_num == 1 else 'floors'}"

            # Add floor details if provided (takes precedence over mezzanine flag)
            if floor_details:
                floor_count += f" ({floor_details})"
            elif has_mezzanine:
                floor_count += " plus one mezzanine/loft level"
        else:
            # Fallback for old string format (backward compatible)
            floor_count = str(floor_num)
            if floor_details:
                floor_count += f" ({floor_details})"

        facade_style = translated_data_en.get('facade_style', 'modern architecture')
        materials = translated_data_en.get('materials_precise', [])
        environment = translated_data_en.get('environment', [])
        tech_specs = translated_data_en.get('technical_specs', {})
        
        # Build user description
        user_description = f"{building_type}, {facade_style}"
        
        # Viewpoint instruction
        viewpoint_info = CAMERA_VIEWPOINTS.get(viewpoint, CAMERA_VIEWPOINTS['main_facade'])
        viewpoint_instruction = viewpoint_info['prompt_addition']
        
        # Technical specs
        camera = tech_specs.get('camera', 'Professional DSLR (Canon 5D Mark IV equivalent)')
        lens = tech_specs.get('lens', '24mm wide-angle lens')

        # Lighting from technical_specs
        lighting = tech_specs.get('lighting', 'natural daylight, golden hour')
        
        # Materials list - handle materials_precise format: {"type": "...", "description": "..."}
        materials_list = ", ".join([
            f"{m.get('type', '')} - {m.get('description', '')[:50]}"
            for m in materials[:3]
            if m.get('type')
        ]) or "context-appropriate materials"

        # ✅ FIX: Environment list - MUST INCLUDE for context (people, vehicles, time of day)
        environment_list = ". ".join([
            f"{e.get('type', '')}: {e.get('description', '')}"
            for e in environment
            if e.get('type') and e.get('description')
        ]) or "urban context"

        # Negative items
        if negative_items is None:
            negative_items = DEFAULT_NEGATIVE_ITEMS
        negative_str = ", ".join(negative_items)

        # Select template
        template = cls.RENDER_WITH_REFERENCE if has_reference else cls.RENDER_WITHOUT_REFERENCE

        # ✅ FIX: Convert sketch_adherence to percentage for clarity in prompt
        adherence_display = f"{sketch_adherence:.2f}"

        # Format prompt
        prompt = template.format(
            sketch_adherence=adherence_display,
            floor_count=floor_count,
            aspect_ratio=aspect_ratio,
            user_description=user_description,
            viewpoint_instruction=viewpoint_instruction,
            camera=camera,
            lens=lens,
            lighting=lighting,
            materials=materials_list,
            environment=environment_list,
            negative_items=negative_str
        )

        return prompt, negative_str
    
    @classmethod
    def build_inpaint_prompt(
        cls,
        edit_instruction: str,
        has_reference: bool = False
    ) -> str:
        """
        Build inpainting prompt
        
        Args:
            edit_instruction: What to do in white area
            has_reference: Whether style reference provided
        
        Returns:
            Formatted prompt
        """
        template = cls.INPAINT_WITH_REFERENCE if has_reference else cls.INPAINT_WITHOUT_REFERENCE
        return template.format(edit_instruction=edit_instruction)
    
    @classmethod
    def build_analysis_prompt(cls) -> str:
        """Get analysis prompt from config"""
        from config import ANALYSIS_SYSTEM_PROMPT_VI
        return ANALYSIS_SYSTEM_PROMPT_VI

    @classmethod
    def build_interior_analysis_prompt(cls) -> str:
        """Get interior analysis prompt from config"""
        from config import INTERIOR_ANALYSIS_SYSTEM_PROMPT_VI
        return INTERIOR_ANALYSIS_SYSTEM_PROMPT_VI

    @classmethod
    def build_translation_prompt(cls) -> str:
        """Get building translation prompt from config"""
        from config import RESTRUCTURE_AND_TRANSLATE_PROMPT
        return RESTRUCTURE_AND_TRANSLATE_PROMPT

    @classmethod
    def build_interior_translation_prompt(cls) -> str:
        """Get interior translation prompt from config"""
        from config import INTERIOR_TRANSLATION_PROMPT
        return INTERIOR_TRANSLATION_PROMPT

    @classmethod
    def build_planning_prompt(
        cls,
        lot_descriptions: List[Dict],
        camera_angle: str = "drone_45deg",
        time_of_day: str = "golden_hour",
        aspect_ratio: str = "16:9",
        style_keywords: str = ""
    ) -> str:
        """
        Build planning mode render prompt

        Args:
            lot_descriptions: List of {lot_number, description} dicts
            camera_angle: Aerial perspective (drone_45deg, birds_eye, etc.)
            time_of_day: Lighting time (golden_hour, midday, etc.)
            aspect_ratio: Target aspect ratio
            style_keywords: Optional style enhancements

        Returns:
            Formatted planning prompt
        """
        # Camera angle descriptions
        camera_angles = {
            "drone_45deg": "Drone view at 45° angle (oblique aerial view showing both horizontal layout and building heights)",
            "birds_eye": "Bird's eye view (90° directly overhead, pure plan view)",
            "low_drone": "Low drone view at 30° (closer to ground, more dramatic building heights)",
            "isometric": "Isometric view (technical 3D view showing all three dimensions equally)"
        }

        # Time of day descriptions
        time_descriptions = {
            "golden_hour": "Golden hour (warm sunset/sunrise lighting, long soft shadows)",
            "midday": "Midday (bright overhead sun, short sharp shadows)",
            "blue_hour": "Blue hour (twilight, cool blue tones, artificial lights on)",
            "overcast": "Overcast day (soft diffused lighting, minimal shadows)"
        }

        # Format lot descriptions
        lot_desc_text = "\n".join([
            f"   LOT {lot['lot_number']}: {lot['description']}"
            for lot in lot_descriptions
        ])

        camera_desc = camera_angles.get(camera_angle, camera_angles["drone_45deg"])
        time_desc = time_descriptions.get(time_of_day, time_descriptions["golden_hour"])

        # Handle empty style keywords
        style_text = style_keywords if style_keywords.strip() else "None specified - use professional architectural visualization standards"

        # Format prompt
        prompt = cls.PLANNING_RENDER_PROMPT.format(
            lot_descriptions=lot_desc_text,
            camera_angle=camera_desc,
            time_of_day=time_desc,
            aspect_ratio=aspect_ratio,
            style_keywords=style_text
        )

        return prompt

    @classmethod
    def build_planning_detail_prompt(
        cls,
        planning_description: str,
        camera_angle: str = "match_sketch",
        time_of_day: str = "golden_hour",
        weather: str = "clear",
        horizon_line: str = "ground_only",
        quality_level: str = "high_fidelity",
        quality_presets: dict = None,
        sketch_adherence: float = 0.90,
        aspect_ratio: str = "16:9"
    ) -> str:
        """
        Build planning detail render prompt using DYNAMIC construction
        """
        # Camera angle descriptions
        camera_angles = {
            "match_sketch": "Match the EXACT camera angle from the source sketch (do NOT change viewing perspective)",
            "drone_45deg": "Drone view at 45° angle (oblique aerial view showing both horizontal layout and building heights)",
            "birds_eye": "Bird's eye view (90° directly overhead, pure plan view)",
            "drone_30deg": "Low drone view at 30° (closer to ground, more dramatic building heights)",
            "eye_level": "Eye-level street view (human perspective from ground level)"
        }

        # Time of day descriptions
        time_descriptions = {
            "golden_hour": "Golden hour (warm sunset/sunrise lighting, long soft shadows, warm tones)",
            "morning": "Early morning (soft diffused light, cool fresh tones, long shadows)",
            "midday": "Midday (bright overhead sun, short sharp shadows, high contrast)",
            "afternoon": "Late afternoon (warm angled light, medium shadows)",
            "evening": "Evening/dusk (artificial lights ON, blue hour, soft ambient glow)",
            "night": "Night (dark sky, artificial lights dominant, dramatic contrast)"
        }

        # Weather descriptions
        weather_descriptions = {
            "clear": "Clear sky (bright, sunny, high visibility)",
            "cloudy": "Overcast/cloudy (diffused soft lighting, minimal shadows)",
            "light_rain": "Light rain (wet surfaces, reflections, atmospheric haze)",
            "foggy": "Foggy/misty (reduced visibility, atmospheric depth, soft diffusion)"
        }

        # Horizon line descriptions
        horizon_line_descriptions = {
            "ground_only": "⚠️ AERIAL VIEW - NO HORIZON LINE. Focus strictly on ground context. Background fades to atmospheric haze.",
            "with_horizon": "✓ DISTANT VIEW - WITH HORIZON LINE. Include visible sky and natural horizon transition."
        }

        # Build render effects list based on quality presets
        if quality_presets is None:
            quality_presets = {}

        effects_list = []
        if quality_presets.get('global_illumination', True):
            effects_list.append("Global Illumination")
        if quality_presets.get('soft_shadows', True):
            effects_list.append("Soft Shadows")
        if quality_presets.get('hdri_sky', True):
            effects_list.append("HDRI Sky")
        if quality_presets.get('reflections', True):
            effects_list.append("Accurate Reflections")
        if quality_presets.get('depth_of_field', True):
            effects_list.append("Depth of Field")
        
        render_effects = ", ".join(effects_list) if effects_list else "Standard photorealistic rendering"

        camera_desc = camera_angles.get(camera_angle, camera_angles["match_sketch"])
        time_desc = time_descriptions.get(time_of_day, time_descriptions["golden_hour"])
        weather_desc = weather_descriptions.get(weather, weather_descriptions["clear"])
        horizon_line_desc = horizon_line_descriptions.get(horizon_line, horizon_line_descriptions["ground_only"])

        # Quality level adjustments with PRO RENDER KEYWORDS
        quality_notes = {
            "standard": "SPEED MODE: Basic textures, clear lighting.",
            "high_fidelity": "ARCHITECTURAL VISUALIZATION: Unreal Engine 5 style, V-Ray rendering qualities, sharp details, professional color grading.",
            "ultra_realism": "AWARD WINNING PHOTOGRAPHY: 8k resolution, highly detailed textures (imperfections, weathering), cinematic lighting, volumetric fog, Octane Render style."
        }
        quality_note = quality_notes.get(quality_level, quality_notes["high_fidelity"])

        # Construct Material Details based on keywords in description to save tokens
        # If description mentions "glass", add glass details, etc.
        material_details_list = []
        desc_lower = planning_description.lower()
        
        if "kính" in desc_lower or "glass" in desc_lower:
            material_details_list.append("Glass: High reflection, Fresnel effect, subtle distortion, varied panel opacity.")
        if "bê tông" in desc_lower or "concrete" in desc_lower:
            material_details_list.append("Concrete: Texture displacement, slight weathering, matte finish.")
        if "gỗ" in desc_lower or "wood" in desc_lower:
            material_details_list.append("Wood: Natural grain, warm tones.")
        
        # Rooftop logic
        aerial_angles = ['drone_45deg', 'birds_eye', 'drone_30deg']
        if camera_angle in aerial_angles or camera_angle == 'match_sketch':
            material_details_list.append("Rooftops: Functional spaces with HVAC units, elevator shafts, not empty flat surfaces.")
            
        material_details = "\n   ".join(material_details_list) if material_details_list else "Use high-quality architectural materials appropriate for the building types."

        # Context details
        context_list = [
            "Roads: Asphalt texture, lane markings",
            "Sidewalks: Paved, pedestrian scale",
            "Vegetation: Varied tree sizes, green zones"
        ]
        context_details = "\n   ".join(context_list)

        # Format prompt using CORE template
        prompt = cls.PLANNING_DETAIL_CORE.format(
            planning_description=planning_description,
            camera_angle=camera_desc,
            horizon_line=horizon_line_desc,
            time_of_day=time_desc,
            weather=weather_desc,
            quality_note=quality_note,
            render_effects=render_effects,
            material_details=material_details,
            context_details=context_details,
            sketch_adherence=f"{sketch_adherence:.2f}",
            aspect_ratio=aspect_ratio
        )

        return prompt

    PLANNING_ANALYZE_PROMPT = """
**VAI TRÒ**: Bạn là chuyên gia phân tích quy hoạch đô thị, chuyên đọc và hiểu bản vẽ kiến trúc.

**CHỈ DẪN QUAN TRỌNG - CHỐNG HALLUCINATION**:
⚠️ Nhiệm vụ của bạn là PHÂN TÍCH những gì CÓ SẴN trong sketch, KHÔNG phải tưởng tượng hoặc đề xuất thêm.
⚠️ KHÔNG đếm khoảng trống thành tòa nhà.
⚠️ KHÔNG đề xuất thêm tòa nhà vào các khu vực trống.
⚠️ CHỈ mô tả những tòa nhà được VẼ RÕ RÀNG trong sketch.

**INPUT**: Bản vẽ quy hoạch/sketch thể hiện dự án phát triển

**NHIỆM VỤ**: Phân tích sketch và trích xuất thông tin có cấu trúc dưới dạng JSON.

**YÊU CẦU PHÂN TÍCH**:

1. **Nhận diện Tỷ lệ (Scale)**:
   - Tìm ký hiệu tỷ lệ (1:500, 1:200, 1:150, 1:100)
   - Nếu không có ký hiệu rõ ràng, ước lượng dựa trên mức độ chi tiết:
     - Chi tiết tối thiểu, chỉ có khối → có thể là 1:500
     - Chi tiết vừa, mặt đứng rõ → có thể là 1:200
     - Chi tiết cao, cửa sổ rõ → có thể là 1:150 hoặc 1:100
   - Trả về một trong: "1:500", "1:200", "1:150", "1:100"

2. **Nhận diện Loại công trình**:
   - Xác định loại dự án phát triển
   - Trả về một trong: "mixed_use", "residential", "industrial", "resort", "campus", "commercial"

3. **Mô tả Tổng quan**:
   - Tóm tắt ngắn gọn 1-2 câu về toàn bộ dự án BẰNG TIẾNG VIỆT
   - Tập trung vào bố cục, cấu trúc và đặc điểm tổng thể

4. **Phân tích Phân khu Cao tầng**:
   ⚠️ QUAN TRỌNG: Chỉ đếm các tòa nhà được VẼ RÕ RÀNG với chiều cao đáng kể
   - count: "X" hoặc "X-Y" (ví dụ: "30-31", "25")
   - floors: "X" hoặc "X-Y" (ví dụ: "38-40", "25-30")
   - style: "modern", "neoclassical", "minimalist", "industrial", hoặc "tropical_modern"
   - colors: Mô tả màu sắc nhìn thấy BẰNG TIẾNG VIỆT (ví dụ: "vàng, trắng, kính")
   - features: Đặc điểm nổi bật BẰNG TIẾNG VIỆT (ví dụ: "lam chắn nắng, ban công, thiết bị mái")

5. **Phân tích Phân khu Thấp tầng**:
   ⚠️ QUAN TRỌNG: Chỉ phát hiện nếu có các tòa nhà thấp tầng được VẼ RÕ RÀNG
   - exists: true/false (false nếu không thấy tòa nhà thấp tầng)
   - floors: "X" hoặc "X-Y" nếu có
   - style: phong cách kiến trúc nếu có
   - colors: màu sắc nhìn thấy BẰNG TIẾNG VIỆT nếu có

6. **Phân tích Cảnh quan**:
   - green_spaces: Mô tả BẰNG TIẾNG VIỆT các không gian xanh, công viên, tiện ích (chỉ nếu có trong sketch)
   - tree_type: "diverse", "tropical", "temperate", hoặc "minimalist" (dựa trên phong cách sketch)
   - road_pattern: "grid", "organic", "radial", hoặc "mixed" (dựa trên bố trí đường nhìn thấy)

**QUY TẮC QUAN TRỌNG**:
✓ Chỉ đếm các tòa nhà RÕ RÀNG NHÌN THẤY trong sketch
✓ Dùng khoảng (ví dụ: "30-31") khi khó đếm chính xác
✓ Nếu không chắc chắn, ước lượng thận trọng
✓ TẤT CẢ các mô tả văn bản phải BẰNG TIẾNG VIỆT
✗ KHÔNG đề xuất thêm tòa nhà vào khoảng trống
✗ KHÔNG đếm lô đất trống thành tòa nhà
✗ KHÔNG tưởng tượng các đặc điểm không thấy trong sketch

**ĐỊNH DẠNG OUTPUT** (CHỈ JSON):
```json
{
  "scale": "1:500",
  "project_type": "mixed_use",
  "overall_description": "Khu đô thị hỗn hợp quy mô lớn với các tòa cao tầng bố trí dạng cụm và phân khu thấp tầng phía bắc.",
  "highrise_zone": {
    "count": "30-31",
    "floors": "38-40",
    "style": "modern",
    "colors": "vàng, trắng, kính",
    "features": "lam chắn nắng, ban công, thiết bị VRV trên mái"
  },
  "lowrise_zone": {
    "exists": true,
    "floors": "3-4",
    "style": "neoclassical",
    "colors": "mái xám đen, tường trắng"
  },
  "landscape": {
    "green_spaces": "công viên trung tâm, sân chơi trẻ em, sân BBQ",
    "tree_type": "diverse",
    "road_pattern": "grid"
  }
}
```

**QUAN TRỌNG**:
- Trả về CHỈ JSON hợp lệ.
- KHÔNG thêm giải thích bên ngoài cấu trúc JSON.
- TẤT CẢ mô tả văn bản (overall_description, colors, features, green_spaces) phải BẰNG TIẾNG VIỆT.
"""

    @classmethod
    def build_planning_analyze_prompt(cls) -> str:
        """
        Build planning sketch analysis prompt

        Returns:
            Analysis prompt for extracting structured data from sketch
        """
        return cls.PLANNING_ANALYZE_PROMPT

    @classmethod
    def build_interior_render_prompt(
        cls,
        translated_data_en: Dict,
        viewpoint: str = "eye_level",
        has_reference: bool = False,
        negative_items: Optional[List[str]] = None,
        sketch_adherence: float = 0.99,
        aspect_ratio: str = "16:9"
    ) -> Tuple[str, str]:
        """
        Build optimized interior render prompt

        Args:
            translated_data_en: English structured interior data
            viewpoint: Camera viewpoint (eye_level, wide_angle, etc.)
            has_reference: Whether reference image is provided
            negative_items: Custom negative items (optional)
            sketch_adherence: How strictly to follow sketch (0.95-1.0, default 0.99 for interiors)
            aspect_ratio: Target aspect ratio (e.g., "16:9")

        Returns:
            (prompt, negative_prompt_summary)
        """
        # Extract interior-specific data
        room_type = translated_data_en.get('room_type', 'Living Room')
        interior_style = translated_data_en.get('interior_style', 'Modern Minimalist')
        room_dimensions = translated_data_en.get('room_dimensions', '')

        # Furniture layout (array of objects with position, description, material)
        furniture_layout = translated_data_en.get('furniture_layout', [])

        # Wall treatments (array for multi-material walls)
        wall_treatments = translated_data_en.get('wall_treatments', [])

        # Flooring and ceiling
        flooring = translated_data_en.get('flooring', {})
        ceiling = translated_data_en.get('ceiling', {})

        # Lighting (array with importance: primary/secondary/accent)
        lighting = translated_data_en.get('lighting', [])

        # Decorations and windows/doors
        decorations = translated_data_en.get('decorations', [])
        windows_doors = translated_data_en.get('windows_doors', [])

        # Environment and atmosphere
        environment = translated_data_en.get('environment', [])

        # Technical specs
        tech_specs = translated_data_en.get('technical_specs', {})

        # Build user description
        user_description = f"{room_type}, {interior_style}"
        if room_dimensions:
            user_description += f" ({room_dimensions})"

        # Camera/viewpoint specification
        camera = tech_specs.get('camera', 'Eye-level perspective capturing the entire room')
        lens = tech_specs.get('lens', '24-35mm wide-angle lens')

        # Lighting description (CRITICAL for interior)
        lighting_emphasis = tech_specs.get('lighting_emphasis', 'Natural lighting with enhanced contrast')

        # Build detailed lighting description
        lighting_parts = []
        for light in lighting:
            light_type = light.get('type', '')
            light_desc = light.get('description', '')
            importance = light.get('importance', 'secondary')
            if light_type and light_desc:
                priority_label = importance.upper() if importance == 'primary' else importance.capitalize()
                lighting_parts.append(f"[{priority_label}] {light_type}: {light_desc}")

        lighting_description = "\n   ".join(lighting_parts) if lighting_parts else "Natural daylight with balanced indoor lighting"

        # Technical enhancements (contrast, sharpness)
        contrast_boost = tech_specs.get('contrast_boost', '+15%')
        sharpness = tech_specs.get('sharpness', '+10%')
        technical_enhancements = f"Contrast boost: {contrast_boost}, Sharpness enhancement: {sharpness}, Ultra-high detail on material textures"

        # Build materials description (comprehensive list from all sources)
        materials_parts = []

        # 1. Wall treatments
        for wall in wall_treatments:
            wall_loc = wall.get('wall_location', '')
            wall_mat = wall.get('materials', '')
            wall_desc = wall.get('description', '')
            if wall_loc and wall_mat:
                materials_parts.append(f"{wall_loc}: {wall_mat} ({wall_desc})")

        # 2. Flooring
        floor_type = flooring.get('type', '')
        floor_desc = flooring.get('description', '')
        floor_rug = flooring.get('rug_carpet', '')
        if floor_type:
            floor_text = f"Floor: {floor_type} - {floor_desc}"
            if floor_rug:
                floor_text += f" with {floor_rug}"
            materials_parts.append(floor_text)

        # 3. Ceiling
        ceiling_type = ceiling.get('type', '')
        ceiling_light = ceiling.get('lighting_system', '')
        if ceiling_type:
            ceiling_text = f"Ceiling: {ceiling_type}"
            if ceiling_light:
                ceiling_text += f" with {ceiling_light}"
            materials_parts.append(ceiling_text)

        # 4. Furniture materials (top 5 items)
        for i, furniture in enumerate(furniture_layout[:5]):
            obj_type = furniture.get('object_type', '')
            material = furniture.get('material', '')
            position = furniture.get('position', '')
            if obj_type and material:
                materials_parts.append(f"{obj_type} ({position}): {material}")

        materials_description = ". ".join(materials_parts) if materials_parts else "Context-appropriate interior materials"

        # Environment & atmosphere
        environment_parts = []
        for env in environment:
            env_type = env.get('type', '')
            env_desc = env.get('description', '')
            if env_type and env_desc:
                environment_parts.append(f"{env_type}: {env_desc}")

        environment_description = ". ".join(environment_parts) if environment_parts else "Calm, luxurious interior atmosphere"

        # Negative items (interior-specific defaults)
        if negative_items is None:
            negative_items = [
                "sketch", "drawing", "illustration", "cartoon", "anime",
                "blurry", "low resolution", "distorted proportions",
                "unrealistic lighting", "adding extra furniture",
                "moving objects", "changing layout", "warm yellow tint"
            ]
        negative_str = ", ".join(negative_items)

        # Select template
        template = cls.INTERIOR_RENDER_WITH_REFERENCE if has_reference else cls.INTERIOR_RENDER_WITHOUT_REFERENCE

        # Convert sketch_adherence to display format
        adherence_display = f"{sketch_adherence:.2f}"

        # Format prompt
        prompt = template.format(
            sketch_adherence=adherence_display,
            aspect_ratio=aspect_ratio,
            viewpoint=viewpoint,
            room_type=room_type,
            interior_style=interior_style,
            user_description=user_description,
            materials_description=materials_description,
            lighting_description=lighting_description,
            technical_enhancements=technical_enhancements,
            environment=environment_description,
            negative_items=negative_str
        )

        return prompt, negative_str