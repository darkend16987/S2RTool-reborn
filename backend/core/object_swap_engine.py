"""
core/object_swap_engine.py - Object Swap Engine

Implements approach 1.2:
  Image 1: Original scene
  Image 2: Binary mask (white = replace, black = preserve)
  Image 3: Reference object photo (optional)

Uses Gemini's multi-image understanding to perform seamless object replacement.
Post-processing with CV2 ensures non-masked areas are perfectly preserved.
"""

import numpy as np
import cv2
from PIL import Image
from typing import Optional

from .gemini_client import GeminiClient
from .prompt_builder import PromptBuilder


class ObjectSwapEngine:
    """Performs object replacement using mask-based approach."""

    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.client = gemini_client or GeminiClient()
        self.prompt_builder = PromptBuilder()

    def swap_object(
        self,
        source_image: Image.Image,
        mask_image: Image.Image,
        reference_object: Optional[Image.Image] = None,
        swap_instruction: str = "",
        preserve_mode: str = "hybrid"
    ) -> Image.Image:
        """
        Perform object swap.

        Args:
            source_image: Original scene (PIL Image)
            mask_image: Binary mask (white=replace, black=preserve) (PIL Image)
            reference_object: Photo of new object to place (PIL Image, optional)
            swap_instruction: Text description of the swap
            preserve_mode: "hybrid" (recommended), "strict", or "gemini_only"

        Returns:
            Edited PIL Image with new object placed
        """
        has_ref = reference_object is not None

        # Build specialized prompt
        prompt = self.prompt_builder.build_object_swap_prompt(
            swap_instruction=swap_instruction,
            has_reference_object=has_ref
        )

        # Prepare binary mask (pure B&W: 0 or 255)
        mask_bw = self._prepare_mask(mask_image)
        mask_pil = Image.fromarray(mask_bw).convert('RGB')

        # Build image list: [source, mask, reference_object?]
        images = [source_image, mask_pil]
        if reference_object is not None:
            images.append(reference_object)

        print(f"🔄 Object Swap: {len(images)} images, instruction='{swap_instruction[:60]}'")

        # Call Gemini with multi-image support
        result_pil = self.client.generate_image_multi(
            prompt=prompt,
            images=images,
            temperature=0.3  # Low temperature for precise preservation
        )

        if result_pil is None:
            raise RuntimeError("Object swap generation failed: no image returned")

        # Ensure result has same dimensions as source
        if result_pil.size != source_image.size:
            result_pil = result_pil.resize(source_image.size, Image.LANCZOS)

        # Post-processing: enforce non-masked area preservation
        if preserve_mode == "gemini_only":
            return result_pil
        elif preserve_mode == "hybrid":
            return self._hybrid_preserve(source_image, result_pil, mask_bw)
        elif preserve_mode == "strict":
            return self._strict_preserve(source_image, result_pil, mask_bw)
        else:
            return self._hybrid_preserve(source_image, result_pil, mask_bw)

    def _prepare_mask(self, mask_image: Image.Image) -> np.ndarray:
        """Convert mask image to pure binary (0 or 255) numpy array."""
        mask_gray = np.array(mask_image.convert('L'))
        _, mask_binary = cv2.threshold(mask_gray, 127, 255, cv2.THRESH_BINARY)
        return mask_binary

    def _hybrid_preserve(
        self,
        original: Image.Image,
        edited: Image.Image,
        mask_binary: np.ndarray
    ) -> Image.Image:
        """
        Hybrid preservation: soft edge blending at mask boundary,
        hard preservation of non-masked areas.
        """
        orig_arr = np.array(original.convert('RGB'))
        edit_arr = np.array(edited.convert('RGB'))

        # Dilate mask slightly then blur for soft edges
        kernel = np.ones((9, 9), np.uint8)
        mask_dilated = cv2.dilate(mask_binary, kernel, iterations=1)
        blend_mask = cv2.GaussianBlur(mask_dilated.astype(np.float32), (21, 21), 0) / 255.0
        blend_mask = np.clip(blend_mask, 0, 1)
        blend_mask_3d = np.stack([blend_mask] * 3, axis=2)

        result = (orig_arr * (1 - blend_mask_3d) + edit_arr * blend_mask_3d).astype(np.uint8)
        return Image.fromarray(result)

    def _strict_preserve(
        self,
        original: Image.Image,
        edited: Image.Image,
        mask_binary: np.ndarray
    ) -> Image.Image:
        """
        Strict preservation: black areas = 100% original pixels.
        Hard cut at mask boundary.
        """
        orig_arr = np.array(original.convert('RGB'))
        edit_arr = np.array(edited.convert('RGB'))

        mask_3d = np.stack([mask_binary] * 3, axis=2) / 255.0
        result = np.where(mask_3d > 0.5, edit_arr, orig_arr).astype(np.uint8)
        return Image.fromarray(result)
