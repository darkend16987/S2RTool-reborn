# S2RTool Feature Research

**Date:** 2026-01-26
**Version:** 4.0

---

## 1. Version Notification System

### Mục tiêu
Thông báo cho users khi có phiên bản mới của S2RTool, giúp họ biết và update kịp thời.

### Các phương án khả thi

#### Option 1: GitHub Releases API (Khuyến nghị)

**Cách hoạt động:**
- Sử dụng GitHub API để kiểm tra latest release
- API endpoint: `https://api.github.com/repos/darkend16987/S2RTool-reborn/releases/latest`
- Trả về JSON với thông tin version, release notes, download URL

**Ưu điểm:**
- Miễn phí
- Không cần server riêng
- Tự động khi tạo release trên GitHub
- Có rate limit cao (60 requests/hour cho unauthenticated)

**Nhược điểm:**
- Cần internet connection
- Phụ thuộc GitHub availability

**Triển khai:**
```javascript
// Frontend: Kiểm tra version khi load trang
async function checkForUpdates() {
    const currentVersion = '4.0.0'; // Hardcode trong app
    try {
        const response = await fetch('https://api.github.com/repos/darkend16987/S2RTool-reborn/releases/latest');
        const data = await response.json();
        const latestVersion = data.tag_name.replace('v', '');

        if (compareVersions(latestVersion, currentVersion) > 0) {
            showUpdateNotification(latestVersion, data.html_url, data.body);
        }
    } catch (error) {
        console.log('Update check failed:', error);
    }
}
```

#### Option 2: JSON File on GitHub (Simple)

**Cách hoạt động:**
- Tạo file `version.json` trên GitHub (raw content)
- URL: `https://raw.githubusercontent.com/darkend16987/S2RTool-reborn/main/version.json`

**File version.json:**
```json
{
    "current_version": "4.0.0",
    "release_date": "2026-01-26",
    "update_url": "https://github.com/darkend16987/S2RTool-reborn/releases/latest",
    "changelog": "- UI Modernization\n- Bug fixes"
}
```

**Ưu điểm:**
- Đơn giản nhất
- Full control nội dung thông báo
- Có thể thêm thông tin tùy chỉnh

**Nhược điểm:**
- Cần update thủ công file khi release

#### Option 3: Google Drive / Cloud Storage

**Cách hoạt động:**
- Đặt file JSON trên Google Drive (public access)
- Sử dụng direct download link

**Ưu điểm:**
- Không cần GitHub
- Dễ update từ bất kỳ đâu

**Nhược điểm:**
- Google Drive có thể thay đổi link format
- Reliability thấp hơn GitHub

### Khuyến nghị Implementation

**Phương án tốt nhất: GitHub Releases API + Fallback JSON**

1. **Primary**: Sử dụng GitHub Releases API
2. **Fallback**: Nếu API fail, check raw `version.json`
3. **Cache**: Lưu kết quả trong localStorage, check mỗi 24h

**Implementation Steps:**

1. Thêm `currentVersion` constant trong frontend
2. Tạo function `checkForUpdates()`
3. Gọi khi load trang (với 5s delay để không block)
4. Hiển thị notification bar nếu có update
5. Cho phép user dismiss và "remind later"

---

## 2. JSON Import/Export Feature

### Mục tiêu
Cho phép users export cấu hình render đã nhập và import lại để tái sử dụng, tiết kiệm thời gian khi render nhiều dự án tương tự.

### Phân tích Form Fields

#### Building Render Form Fields:
```json
{
    "buildingConfig": {
        "main_description": "Loại công trình",
        "facade_style": "Phong cách kiến trúc",
        "floor_count": 3,
        "has_mezzanine": false,
        "floor_details": "Mô tả chi tiết tầng",
        "aspect_ratio": "16:9",
        "viewpoint": "match_sketch",
        "sketch_adherence": 0.95,
        "critical_elements": ["element1", "element2"],
        "materials": [
            {"component": "wall", "material": "concrete"},
            {"component": "window", "material": "glass"}
        ],
        "environment": {
            "location": "Khu đô thị hiện đại",
            "time_of_day": "golden_hour",
            "weather": "clear",
            "vegetation": "Cây xanh nhiệt đới"
        },
        "quality": {
            "preset": "high_fidelity",
            "lighting": "natural",
            "atmosphere": "professional"
        }
    },
    "metadata": {
        "version": "4.0",
        "mode": "building",
        "created_at": "2026-01-26T10:00:00Z",
        "name": "My Building Project"
    }
}
```

#### Interior Render Form Fields:
```json
{
    "interiorConfig": {
        "room_type": "Phòng khách",
        "interior_style": "Modern Minimalist",
        "viewpoint": "match_sketch",
        "aspect_ratio": "16:9",
        "sketch_adherence": 0.99,
        "furniture_layout": [
            {"item": "sofa", "description": "Sofa chữ L màu xám"},
            {"item": "table", "description": "Bàn cafe gỗ sồi"}
        ],
        "wall_treatments": [
            {"wall": "main", "material": "Sơn trắng mờ"}
        ],
        "flooring": {
            "type": "Sàn gỗ sồi",
            "description": "Màu sáng, vân gỗ tự nhiên",
            "rug": "Thảm len xám"
        },
        "ceiling": {
            "type": "Trần thạch cao phẳng",
            "lighting": "Đèn âm trần LED"
        },
        "lighting_sources": [
            {"type": "natural", "source": "Cửa sổ lớn"},
            {"type": "ambient", "source": "Đèn LED ẩn"}
        ],
        "environment": {
            "time_of_day": "afternoon",
            "atmosphere": "warm"
        }
    },
    "metadata": {
        "version": "4.0",
        "mode": "interior",
        "created_at": "2026-01-26T10:00:00Z",
        "name": "Living Room Design"
    }
}
```

### Implementation Plan

#### Phase 1: Export Feature

1. **Add Export Button** to form
   - Vị trí: Cuối form, cạnh nút Render
   - Icon: `download` Material Symbol
   - Text: "Xuất Config (JSON)"

2. **Collect Form Data**
```javascript
function collectFormData() {
    return {
        buildingConfig: {
            main_description: document.getElementById('main_description').value,
            facade_style: document.getElementById('facade_style').value,
            floor_count: parseInt(document.getElementById('floor_count').value),
            // ... other fields
        },
        metadata: {
            version: '4.0',
            mode: 'building',
            created_at: new Date().toISOString(),
            name: prompt('Tên config (để nhận diện sau này):') || 'Untitled'
        }
    };
}
```

3. **Download JSON File**
```javascript
function exportConfig() {
    const data = collectFormData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `s2rtool-config-${data.metadata.mode}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
```

#### Phase 2: Import Feature

1. **Add Import Button** to form
   - Vị trí: Cạnh Export button
   - Icon: `upload` Material Symbol
   - Text: "Nhập Config"

2. **File Input Handler**
```javascript
function importConfig() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        const text = await file.text();
        try {
            const data = JSON.parse(text);
            validateAndApplyConfig(data);
        } catch (error) {
            showError('File JSON không hợp lệ');
        }
    };
    input.click();
}
```

3. **Apply Config to Form**
```javascript
function validateAndApplyConfig(data) {
    // Validate version compatibility
    if (!data.metadata || data.metadata.version !== '4.0') {
        showWarning('Config từ phiên bản khác, có thể không tương thích hoàn toàn');
    }

    // Apply to form fields
    if (data.buildingConfig) {
        applyBuildingConfig(data.buildingConfig);
    } else if (data.interiorConfig) {
        applyInteriorConfig(data.interiorConfig);
    }

    showSuccess('Đã nhập config thành công!');
}

function applyBuildingConfig(config) {
    document.getElementById('main_description').value = config.main_description || '';
    document.getElementById('facade_style').value = config.facade_style || '';
    document.getElementById('floor_count').value = config.floor_count || 3;
    document.getElementById('has_mezzanine').checked = config.has_mezzanine || false;
    // ... apply other fields

    // Handle dynamic containers (materials, elements)
    if (config.materials) {
        populateMaterialsContainer(config.materials);
    }
    if (config.critical_elements) {
        populateElementsContainer(config.critical_elements);
    }
}
```

#### Phase 3: UX Enhancements

1. **Config Library**
   - Lưu configs vào localStorage
   - Quick select từ dropdown
   - Rename/Delete saved configs

2. **Template System**
   - Pre-built templates (Modern Villa, Office Building, etc.)
   - User custom templates

3. **Config Preview**
   - Modal hiển thị nội dung trước khi import
   - Compare với current values

### UI Design

```
┌─────────────────────────────────────────────────┐
│  [Form Fields...]                               │
│                                                 │
├─────────────────────────────────────────────────┤
│  Config Management                              │
│  ┌─────────────┐  ┌─────────────┐              │
│  │ 📤 Xuất     │  │ 📥 Nhập     │              │
│  │ Config      │  │ Config      │              │
│  └─────────────┘  └─────────────┘              │
│                                                 │
│  Saved Configs: [Select...▼]                    │
└─────────────────────────────────────────────────┘
```

### File Naming Convention

```
s2rtool-config-{mode}-{timestamp}.json
s2rtool-config-building-1706270400000.json
s2rtool-config-interior-1706270400000.json
```

### Error Handling

1. **Invalid JSON**: Parse error message
2. **Wrong Mode**: Warn if importing building config to interior page
3. **Missing Fields**: Use defaults for missing values
4. **Version Mismatch**: Warn but allow import

---

## Implementation Priority

### High Priority (Nên làm trước)
1. JSON Export for Building Render
2. JSON Import for Building Render
3. Version check notification (GitHub API)

### Medium Priority
4. JSON Export/Import for Interior Render
5. LocalStorage config library
6. Pre-built templates

### Low Priority
7. Config preview modal
8. Cloud sync (future)
9. Share config via link (future)

---

## Technical Notes

### Backward Compatibility
- Include version in metadata
- Document schema changes between versions
- Provide migration scripts if needed

### Security Considerations
- Validate all imported data
- Sanitize text inputs
- Don't execute any code from JSON

### Performance
- Keep JSON files small (< 50KB typically)
- Lazy load template library
- Cache version check results

---

**Document Status:** Research Complete
**Next Steps:** Implementation based on priority list
