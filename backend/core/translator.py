"""
core/translator.py - Vietnamese to English Translation
"""

from typing import Dict, Optional
from .gemini_client import GeminiClient
from .prompt_builder import PromptBuilder
from config import Models


class Translator:
    """Translate and restructure form data"""
    
    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        """
        Initialize translator
        
        Args:
            gemini_client: GeminiClient instance (creates new if None)
        """
        self.client = gemini_client or GeminiClient()
        self.prompt_builder = PromptBuilder()
    
    def translate_vi_to_en(self, form_data_vi: Dict, mode: str = 'building') -> Dict:
        """
        Translate Vietnamese form data to English structured format

        Args:
            form_data_vi: Vietnamese form data
            mode: Translation mode ('building' or 'interior')

        Returns:
            English structured data

        Raises:
            ValueError: If translation fails validation
        """
        import json

        # Get translation prompt based on mode
        if mode == 'interior':
            translation_prompt = self.prompt_builder.build_interior_translation_prompt()
        else:
            translation_prompt = self.prompt_builder.build_translation_prompt()

        # Prepare input
        prompt_parts = [
            translation_prompt,
            json.dumps(form_data_vi, ensure_ascii=False)
        ]

        # Call Gemini
        translated_data = self.client.generate_content_json(
            prompt_parts=prompt_parts,
            model_name=Models.PRO,
            temperature=0.1
        )

        # Validate output with mode awareness
        self._validate_translation(translated_data, form_data_vi, mode=mode)

        return translated_data
    
    def _validate_translation(self, translated: Dict, original: Dict, mode: str = 'building') -> None:
        """
        Validate translation completeness

        ✅ FIX: Mode-aware validation for building and interior translations

        Args:
            translated: Translated data
            original: Original Vietnamese data
            mode: Translation mode ('building' or 'interior')

        Raises:
            ValueError: If validation fails
        """
        if mode == 'interior':
            # Interior-specific required fields
            required_fields = [
                'room_type',
                'interior_style',
                'furniture_layout',
                'wall_treatments',
                'flooring',
                'ceiling',
                'lighting',
                'technical_specs'
            ]
        else:
            # Building-specific required fields
            required_fields = [
                'building_type',
                'floor_count',
                'facade_style',
                'critical_elements',
                'materials_precise',
                'environment',
                'technical_specs'
            ]

        missing = [f for f in required_fields if f not in translated or not translated[f]]

        if missing:
            raise ValueError(f"Translation missing fields: {missing}")

        # Mode-specific validations
        if mode == 'building':
            # 🚨 CRITICAL: Floor count validation (HIGHEST PRIORITY!)
            original_floor_count = original.get('floor_count', '')
            translated_floor_count = translated.get('floor_count', '')

            if original_floor_count and not translated_floor_count:
                print(f"🚨 CRITICAL WARNING: Floor count MISSING in translation!")
                print(f"   Original: '{original_floor_count}' → Translated: NONE")
                print(f"   This MUST be preserved for architectural accuracy!")
            elif original_floor_count and translated_floor_count:
                # Extract numbers for comparison
                import re
                orig_num = re.findall(r'\d+', str(original_floor_count))
                trans_num = re.findall(r'\d+', str(translated_floor_count))
                if orig_num != trans_num:
                    print(f"⚠️ WARNING: Floor count NUMBER changed in translation!")
                    print(f"   Original: '{original_floor_count}' ({orig_num}) → Translated: '{translated_floor_count}' ({trans_num})")

            # ✅ FIX: Check materials count
            original_materials = len(original.get('materials_precise', []))
            translated_materials = len(translated.get('materials_precise', []))

            if translated_materials < original_materials * 0.8:  # Allow 20% loss
                print(f"⚠️ Warning: Lost {original_materials - translated_materials} materials in translation")

            # ✅ ADD: Check environment items count (CRITICAL for people, vehicles, time of day)
            original_environment = len(original.get('environment', []))
            translated_environment = len(translated.get('environment', []))

            if translated_environment < original_environment:
                lost_count = original_environment - translated_environment
                print(f"⚠️ WARNING: Lost {lost_count} environment items in translation!")

        elif mode == 'interior':
            # Interior-specific validations
            # Check furniture layout count
            original_furniture = len(original.get('furniture_layout', []))
            translated_furniture = len(translated.get('furniture_layout', []))

            if translated_furniture < original_furniture:
                lost_count = original_furniture - translated_furniture
                print(f"⚠️ WARNING: Lost {lost_count} furniture items in translation!")

            # Check lighting items count (CRITICAL for interiors)
            original_lighting = len(original.get('lighting', []))
            translated_lighting = len(translated.get('lighting', []))

            if translated_lighting < original_lighting:
                lost_count = original_lighting - translated_lighting
                print(f"⚠️ WARNING: Lost {lost_count} lighting items in translation!")