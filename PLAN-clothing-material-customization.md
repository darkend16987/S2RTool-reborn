# Implementation Plan: Object Swap + 2D Floor Plan Material Render + Render History

## Phân tích hệ thống hiện tại

### Architecture Summary
- **Frontend**: Vanilla HTML/CSS/JS (Nginx served), mỗi mode = 1 file HTML + JS riêng
- **Backend**: Flask + Blueprints, thread-safe, modular
- **AI Pipeline**: Gemini 2.5-pro (analysis) → Gemini 2.5-flash (translate VI→EN) → Gemini 3-pro-image-preview (render)
- **Existing modes**: Building, Interior, Planning, Planning Detail
- **Inpainting**: Đã có engine cơ bản (hybrid CV2 + Gemini) nhưng chưa có UI riêng

---

## FEATURE 1: Object Swap (Đổi đồ)

### Phân tích các approach

#### Option 1.1: Ảnh source + overlay đánh dấu + ảnh đồ vật + prompt
- **Ưu**: Đơn giản, user chỉ cần tô vùng cần đổi
- **Nhược**: AI phải tự hiểu overlay = vùng cần swap → dễ nhầm lẫn
- **Gemini compatibility**: Gemini 3-pro-image-preview nhận multi-image input tốt, nhưng overlay opacity có thể làm AI confused giữa "thêm layer" vs "thay thế vùng"

#### Option 1.2: Ảnh source + mask riêng + ảnh đồ vật + prompt ✅ RECOMMENDED
- **Ưu**: Tách biệt rõ source vs mask → AI hiểu rõ "vùng nào giữ, vùng nào thay"
- **Ưu**: Tương thích tốt với inpainting engine hiện có (đã có mask processing logic)
- **Ưu**: Gemini nhận 3 images (source, mask, reference item) → prompt engineering kiểm soát tốt
- **Nhược**: User cần 1 bước vẽ mask → cần canvas tool

#### Option 1.3: Canvas mix
- **Ưu**: Flexible
- **Nhược**: Quá phức tạp cho user flow, overkill

#### Option 1.4 (Suggest): **Hybrid 1.2 + Smart Detection**
- Kết hợp 1.2 + thêm **AI-assisted object detection**: user click/tap vào đồ vật → AI tự segment → tạo mask tự động
- Flow: Upload ảnh → AI detect objects → user click chọn object → auto-mask → upload ảnh đồ mới → render
- Đây là approach tối ưu nhưng phức tạp hơn, suggest làm 1.2 trước, upgrade lên 1.4 sau

### ✅ RECOMMENDED APPROACH: Option 1.2 (với mask drawing canvas)

### Lý do kỹ thuật:
1. **Gemini 3-pro-image-preview** nhận tối đa 3+ images trong 1 request (đã verify qua `generate_image()` hiện tại chỉ dùng 2: source + reference)
2. Hệ thống đã có `InpaintingEngine` với `generate_with_inpaint()` - cần extend thêm logic cho object swap
3. Canvas drawing cho mask đã có precedent trong inpainting UI (nếu có), hoặc dễ implement bằng HTML Canvas API
4. Prompt engineering kiểm soát rõ ràng: "Image 1 = scene, Image 2 = mask (white=replace), Image 3 = new object"

### Flow chi tiết:

```
Step 1: User upload ảnh source (ảnh nội thất/không gian)
Step 2: User vẽ mask trên canvas (brush tool, eraser) đánh dấu vùng đồ vật cần đổi
        → Tạo mask image (white = vùng cần thay, black = giữ nguyên)
Step 3: User upload ảnh đồ vật mới muốn thay vào
Step 4: System gửi 3 images + prompt tới Gemini:
        - Image 1: Original scene
        - Image 2: Mask (white zone = replace area)
        - Image 3: New object reference photo
        - Prompt: Engineered prompt với anti-hallucination rules
Step 5: Gemini trả về ảnh mới
Step 6: Post-processing (hybrid preserve mode) → Output
```

### Prompt Engineering Strategy cho Object Swap:

```
**ROLE**: Expert interior/architectural image editor

**TASK**: OBJECT REPLACEMENT
- Image 1: Original interior/scene photo
- Image 2: Binary mask (WHITE = area to replace, BLACK = preserve exactly)
- Image 3: Reference photo of the NEW object to place

**CRITICAL RULES**:
1. REPLACE ONLY the white-masked area with the new object from Image 3
2. MATCH the perspective, scale, lighting, and shadows of the original scene
3. The new object MUST:
   ✓ Match the viewing angle of the original scene
   ✓ Scale proportionally to surrounding objects
   ✓ Have consistent lighting direction and intensity
   ✓ Cast appropriate shadows matching scene lighting
   ✓ Blend seamlessly at mask boundaries
4. PRESERVE 100% of the non-masked area (BLACK zone):
   ✓ No changes to other furniture/objects
   ✓ No changes to walls, floor, ceiling
   ✓ No changes to lighting conditions
   ✓ No color shift or tone changes
5. FORBIDDEN:
   ✗ Do NOT add any objects not in the reference
   ✗ Do NOT change the camera angle
   ✗ Do NOT modify anything outside the masked area
   ✗ Do NOT change room proportions or layout
```

### Backend Implementation:

**New files:**
- `backend/api/object_swap.py` - New Blueprint endpoint
- `backend/core/object_swap_engine.py` - Core swap logic (extends inpainting)

**Modified files:**
- `backend/core/prompt_builder.py` - Add `build_object_swap_prompt()`
- `backend/core/gemini_client.py` - Add `generate_with_object_swap()` (3 images)
- `backend/config.py` - Add ObjectSwap config
- `backend/app.py` - Register new blueprint

**Frontend:**
- `frontend/object-swap.html` - New page
- `frontend/object-swap-script.js` - New script
- `frontend/index.html` - Add new card on landing page

---

## FEATURE 2: 2D Floor Plan Material/Color Render

### Approach Analysis:

Tính năng này phù hợp nhất với flow tương tự **Interior Render** nhưng specialized cho góc nhìn top-down 2D:

### Flow chi tiết:

```
Step 1: User upload ảnh mặt bằng 2D (floor plan)
Step 2: AI Analysis (gemini-2.5-pro) phân tích:
        - Loại phòng (bedroom, kitchen, bathroom, living room...)
        - Objects trong mỗi phòng (giường, bàn, ghế, bồn tắm, bếp...)
        - Cầu thang (lên/xuống theo chuẩn vẽ kiến trúc)
        - Tủ bếp treo, tủ âm tường
        - Cửa (cửa đi, cửa sổ, cửa trượt)
        - Tường, vách ngăn
        - Kích thước phòng ước tính
Step 3: User review + chỉnh sửa thông tin AI detect (form tương tự interior)
        - Chỉnh loại phòng nếu sai
        - Chỉnh/thêm objects
        - Chọn style, material, color scheme
Step 4: (Optional) Upload ảnh reference cho style
Step 5: Render với Gemini 3-pro-image-preview:
        - Source image: floor plan gốc
        - Reference image: style reference (optional)
        - Prompt: Engineered prompt cho 2D material render
Step 6: Output ảnh mặt bằng đã đổ màu/vật liệu
```

### Pre-config ngầm (Critical Domain Knowledge):

```python
FLOORPLAN_PRESETS = {
    "staircase": {
        "up": "Cầu thang lên: nét song song xiên + mũi tên hướng lên, nét liền",
        "down": "Cầu thang xuống: nét song song xiên + nét đứt (dashed lines)",
        "render": "Wooden/marble stairs with handrail, top-down view"
    },
    "hanging_cabinet": {
        "detect": "Nét đứt (dashed line) sát tường bếp = tủ bếp treo",
        "render": "Wall-mounted cabinet, visible as shadow/outline from above"
    },
    "door_types": {
        "swing": "1/4 circle arc = cửa mở xoay",
        "sliding": "Dashed parallel lines = cửa trượt",
        "double": "Two opposing arcs = cửa đôi"
    },
    "wall_types": {
        "thick": "Tường chịu lực (>= 200mm in drawing scale)",
        "thin": "Vách ngăn nhẹ (< 200mm)"
    }
}
```

### Prompt Engineering Strategy cho 2D Floor Plan:

```
**ROLE**: Expert architectural visualization artist specializing in 2D floor plan rendering

**TASK**: MATERIAL & COLOR RENDERING for 2D Floor Plan
- Image 1: Source 2D floor plan (technical drawing)
- Image 2: Style reference (optional)

**ABSOLUTE REQUIREMENTS**:
1. MAINTAIN TOP-DOWN VIEW (CRITICAL - NON-NEGOTIABLE)
   ✓ Keep EXACT bird's eye / plan view perspective
   ✓ No 3D perspective, no isometric, no axonometric
   ✓ Camera position: directly overhead, looking straight down

2. PRESERVE LAYOUT (CRITICAL)
   ✓ Keep EXACT room shapes, proportions, ratios
   ✓ Keep EXACT wall positions and thicknesses
   ✓ Keep ALL objects at their EXACT positions
   ✓ Keep EXACT relative distances between objects
   ✓ Keep EXACT room sizes and apartment overall shape

3. OBJECT FIDELITY
   ✓ Render ONLY objects visible in the floor plan
   ✓ Match object count exactly
   ✓ Preserve object types (bed, table, sofa, toilet, sink, etc.)
   ✗ Do NOT add furniture or objects not in the floor plan
   ✗ Do NOT remove or relocate any objects
   ✗ Do NOT create deformed or distorted objects

4. MATERIAL & COLOR APPLICATION
   ✓ Apply photorealistic materials/textures from top-down view
   ✓ Apply specified color scheme to walls, floors, furniture
   ✓ Different rooms may have different flooring materials
   ✓ Furniture rendered with realistic material textures

5. LIGHTING
   ✓ Simulated top-down overhead lighting
   ✓ Soft light from windows/doors (indicated in floor plan)
   ✓ Subtle shadows under furniture (top-down shadow projection)
   ✓ No dramatic side lighting

6. FORBIDDEN
   ✗ Do NOT change viewpoint angle
   ✗ Do NOT add rooms, walls, or spaces not in the original
   ✗ Do NOT distort proportions or room shapes
   ✗ Do NOT create 3D perspective views
```

### Analysis Prompt cho Floor Plan (Vietnamese):

```
**BẠN LÀ**: Chuyên gia phân tích bản vẽ mặt bằng kiến trúc 2D

**NHIỆM VỤ**: Phân tích mặt bằng 2D và xác định:
1. Tổng thể: Loại căn hộ/nhà, số phòng, tổng diện tích ước tính
2. Từng phòng: Loại phòng, diện tích ước, các vật dụng bên trong
3. Cầu thang: Loại (lên/xuống), vị trí
4. Tủ bếp: Tủ đứng vs tủ treo (nét đứt = tủ treo)
5. Cửa: Loại cửa (mở xoay, trượt, đôi), vị trí
6. Tường: Tường chịu lực vs vách ngăn

**QUY TẮC ĐẶC BIỆT**:
- Nét đứt (dashed lines) trên tường bếp = tủ bếp treo
- Cầu thang có mũi tên hướng lên + nét liền = cầu thang lên
- Cầu thang có nét đứt = cầu thang xuống (nhìn từ tầng hiện tại)
- Arc 1/4 hình tròn tại cửa = cửa mở xoay, chiều arc = hướng mở
```

### Backend Implementation:

**New files:**
- `backend/api/floorplan.py` - New Blueprint endpoint
- `backend/core/floorplan_analyzer.py` - Floor plan specific analysis logic

**Modified files:**
- `backend/core/prompt_builder.py` - Add `build_floorplan_analysis_prompt()` + `build_floorplan_render_prompt()`
- `backend/config.py` - Add FloorPlanConfig, FLOORPLAN_PRESETS
- `backend/app.py` - Register new blueprint

**Frontend:**
- `frontend/floorplan-render.html` - New page
- `frontend/floorplan-script.js` - New script
- `frontend/index.html` - Add new card

---

## FEATURE 3: Render History

### Approach:

**Hoàn toàn khả thi** với local storage approach. Phân tích:

1. Hệ thống chạy hoàn toàn local (Docker trên máy user)
2. Rendered images hiện chỉ trả về base64 → không persist
3. Tạo folder `render_history/` tại root level, gitignore nó

### Architecture:

```
S2RTool-reborn/
├── render_history/           ← NEW (gitignored)
│   ├── building/
│   │   ├── 2026-02-27_143052_abc123.png
│   │   └── 2026-02-27_143052_abc123.json  (metadata)
│   ├── interior/
│   ├── planning/
│   ├── planning_detail/
│   ├── object_swap/
│   └── floorplan/
```

### Metadata JSON per render:

```json
{
    "id": "abc123",
    "timestamp": "2026-02-27T14:30:52",
    "mode": "interior",
    "source_thumbnail": "base64_small_thumb",
    "render_image": "2026-02-27_143052_abc123.png",
    "prompt_summary": "Modern living room, Scandinavian style",
    "settings": {
        "aspect_ratio": "16:9",
        "viewpoint": "match_sketch",
        "quality": "high_fidelity"
    }
}
```

### Implementation:

**Backend:**
- `backend/api/history.py` - New Blueprint (GET list, GET image, DELETE)
- `backend/core/history_manager.py` - Save/load/list/delete renders
- Mỗi render endpoint (render.py, planning.py, etc.) → auto-save sau khi render thành công

**Frontend:**
- `frontend/render-history.html` - Gallery page
- `frontend/render-history-script.js` - Gallery logic
- Mỗi render page → thêm nút "Xem lịch sử" nhỏ

**Gitignore:**
```
# Render history (local only, not synced)
render_history/
```

### Docker Volume:
```yaml
volumes:
  - render-history:/app/render_history
```

---

## IMPLEMENTATION PLAN (Step by step)

### Phase 1: Foundation (không ảnh hưởng hệ thống hiện tại)

1. **Tạo branch mới** từ main
2. **Render History System** (ưu tiên vì nó serve tất cả features)
   - `backend/core/history_manager.py`
   - `backend/api/history.py`
   - Update `.gitignore`
   - Update `docker-compose.yaml` (thêm volume)
   - Integrate auto-save vào existing render endpoints
   - `frontend/render-history.html` + JS
   - Thêm link trên mỗi render page

### Phase 2: Object Swap Feature

3. **Backend Object Swap**
   - `backend/core/prompt_builder.py` - thêm `build_object_swap_prompt()`
   - `backend/core/gemini_client.py` - extend `generate_image()` nhận 3+ images
   - `backend/core/object_swap_engine.py` - new engine
   - `backend/api/object_swap.py` - new endpoint
   - `backend/config.py` - thêm config
   - `backend/app.py` - register blueprint

4. **Frontend Object Swap**
   - `frontend/object-swap.html` - Full UI với canvas mask tool
   - `frontend/object-swap-script.js` - Logic: upload, draw mask, upload ref, render
   - `frontend/index.html` - Thêm card mới

### Phase 3: 2D Floor Plan Material Render

5. **Backend Floor Plan**
   - `backend/core/prompt_builder.py` - thêm floor plan prompts
   - `backend/core/floorplan_analyzer.py` - Analysis logic
   - `backend/api/floorplan.py` - new endpoint
   - `backend/config.py` - thêm FLOORPLAN_PRESETS
   - `backend/app.py` - register blueprint

6. **Frontend Floor Plan**
   - `frontend/floorplan-render.html` - Full UI
   - `frontend/floorplan-script.js` - Logic
   - `frontend/index.html` - Thêm card mới

### Phase 4: Testing & Polish

7. **Integration testing** - Test tất cả flow
8. **UI consistency** - Đảm bảo style nhất quán
9. **Error handling** - Edge cases
10. **Landing page** - Update grid layout cho 6 cards (hiện có 4)

---

## Đảm bảo không conflict với hệ thống hiện tại

| Aspect | Strategy |
|--------|----------|
| **Backend routes** | Tất cả endpoint mới dùng prefix riêng: `/api/object-swap/*`, `/api/floorplan/*`, `/api/history/*` |
| **Frontend pages** | File HTML/JS hoàn toàn mới, không sửa existing files (trừ index.html thêm card) |
| **Shared code** | Chỉ extend (thêm methods mới) vào `prompt_builder.py`, `gemini_client.py`, `config.py` - KHÔNG sửa code cũ |
| **Docker** | Thêm volumes mới, không thay đổi existing volumes |
| **Database** | Không cần DB, dùng file system (JSON + images) |
| **Git** | `render_history/` gitignored |

---

## Gemini API Technical Notes

### Gemini 3-pro-image-preview capabilities:
- Nhận **multiple images** trong 1 request (đã verify: source + reference trong code hiện tại)
- Có thể extend lên **3+ images** (source + mask + reference object)
- **Native image generation** (không cần separate Imagen API)
- Hỗ trợ **2K resolution** output
- Temperature control cho creativity vs fidelity

### Cho Object Swap:
- Gửi 3 images: original + mask + new_object_ref
- Prompt engineering mạnh để kiểm soát spatial consistency
- Post-processing hybrid (CV2) để ensure non-masked areas preserved 100%

### Cho Floor Plan:
- Gửi 1-2 images: floor_plan + optional style_ref
- Analysis prompt đặc biệt cho 2D architectural drawing
- Render prompt nhấn mạnh: TOP-DOWN VIEW + PRESERVE PROPORTIONS
- Temperature thấp (0.3-0.4) để minimize hallucination
