// ============================================
// INTERIOR S2R TOOL - Frontend JavaScript
// Version: 1.0 - Interior Render Workflow
// Based on building-script.js structure
// ============================================

// ============== CONFIG ==============
const API_BASE_URL = '/api';

// ============== STATE ==============
let currentSketchImage = null;
let currentAnalysisData = null;
let currentTranslatedData = null;
let currentRenderedImage = null;
let currentReferenceImage = null;

// Processing state
let isAnalyzing = false;
let isTranslating = false;
let isRendering = false;

// ============== IMAGE PREVIEW MODAL CLASS ==============
class ImagePreviewModal {
    constructor() {
        this.modal = null;
        this.img = null;
        this.info = null;
        this.closeBtn = null;
        this.isActive = false;
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'image-preview-modal';
        this.modal.innerHTML = `
            <div class="image-preview-content">
                <img class="image-preview-img" src="" alt="Preview">
                <button class="image-preview-close" aria-label="Close preview">×</button>
                <div class="image-preview-info"></div>
            </div>
        `;

        this.img = this.modal.querySelector('.image-preview-img');
        this.closeBtn = this.modal.querySelector('.image-preview-close');
        this.info = this.modal.querySelector('.image-preview-info');

        document.body.appendChild(this.modal);
    }

    bindEvents() {
        this.closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hide();
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal || e.target === this.img) {
                this.hide();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.hide();
            }
        });

        this.img.addEventListener('load', () => {
            const width = this.img.naturalWidth;
            const height = this.img.naturalHeight;
            this.info.textContent = `${width} × ${height}px`;
        });
    }

    show(imageSrc) {
        if (!imageSrc) {
            console.warn('⚠️ No image source provided');
            return;
        }

        this.img.src = imageSrc;
        this.isActive = true;
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
            this.modal.classList.add('active');
        });

        console.log('🖼️ Image preview opened');
    }

    hide() {
        this.isActive = false;
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        console.log('✅ Image preview closed');
    }
}

// Global instance
let imagePreviewModal = null;

// ============== DOM ELEMENTS ==============
let uploadSketch, previewImage, uploadLabel, analyzeButton, generateButton;
let gallery, aspectRatioSelect;

// ============== INIT ==============
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Interior S2R Tool v1.0 initialized');

    // Initialize Image Preview Modal
    imagePreviewModal = new ImagePreviewModal();
    console.log('✅ Image Preview Modal initialized');

    // Initialize DOM Elements
    uploadSketch = document.getElementById('uploadSketch');
    previewImage = document.getElementById('previewImage');
    uploadLabel = document.getElementById('uploadLabel');
    analyzeButton = document.getElementById('analyzeSketchButton');
    generateButton = document.getElementById('generateRenderButton');
    gallery = document.getElementById('gallery');
    aspectRatioSelect = document.getElementById('aspect_ratio');

    // Setup
    loadAspectRatios();
    setupEventListeners();
    setupDynamicContainers();
    setupExportButton();
});

// ============== ASPECT RATIOS ==============
async function loadAspectRatios() {
    if (!aspectRatioSelect) return;

    const ratios = {
        "1:1": "Vuông (2048×2048)",
        "3:4": "Chân dung (1536×2048)",
        "4:3": "Tiêu chuẩn (2048×1536)",
        "9:16": "Dọc (1152×2048)",
        "16:9": "Widescreen (2048×1152) - Panorama"
    };

    aspectRatioSelect.innerHTML = '';
    for (const [value, label] of Object.entries(ratios)) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        if (value === "16:9") option.selected = true;
        aspectRatioSelect.appendChild(option);
    }
}

// ============== EVENT LISTENERS ==============
function setupEventListeners() {
    // File upload
    if (uploadSketch) {
        uploadSketch.addEventListener('change', handleImageUpload);
    }

    // Click preview to view full size
    if (previewImage) {
        previewImage.addEventListener('click', () => {
            if (imagePreviewModal) {
                imagePreviewModal.show(previewImage.src);
            }
        });
    }

    // Analyze button
    if (analyzeButton) {
        analyzeButton.addEventListener('click', analyzeSketch);
    }

    // Generate button
    if (generateButton) {
        generateButton.addEventListener('click', generateRender);
    }

    // Download and Regenerate (event delegation)
    document.addEventListener('click', (e) => {
        if (e.target.closest('#downloadImageBtn')) {
            handleDownloadImage();
        }
        if (e.target.closest('#regenerateBtn')) {
            generateRender();
        }
    });

    // Range slider display
    const sketchAdherence = document.getElementById('sketch_adherence');
    const sketchAdherenceValue = document.getElementById('sketch_adherence_value');
    if (sketchAdherence && sketchAdherenceValue) {
        sketchAdherence.addEventListener('input', (e) => {
            sketchAdherenceValue.textContent = e.target.value;
        });
    }

    // Add dynamic item buttons
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const containerId = e.target.dataset.container;
            const container = document.getElementById(containerId);
            const type = e.target.dataset.type;
            if (container) {
                addDynamicItem(container, type);
            }
        });
    });
}

// ============== IMAGE OPTIMIZATION ==============
async function optimizeImageForUpload(file) {
    const MAX_DIMENSION = 1024;

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
                console.log(`📐 Resizing image: ${img.width}×${img.height} → ${width}×${height}`);
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(resolve, 'image/png');
        };
        img.src = URL.createObjectURL(file);
    });
}

// ============== IMAGE UPLOAD ==============
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        console.log(`📤 Processing upload: ${file.name}`);
        const optimizedBlob = await optimizeImageForUpload(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            currentSketchImage = e.target.result;

            if (previewImage) {
                previewImage.src = e.target.result;
                previewImage.classList.remove('hidden');
                previewImage.title = 'Click to view full size';
            }

            if (uploadLabel) {
                uploadLabel.classList.add('hidden');
            }

            if (analyzeButton) {
                analyzeButton.disabled = false;
            }

            console.log('✅ Image ready for analysis');
        };
        reader.readAsDataURL(optimizedBlob);

    } catch (error) {
        console.error('❌ Image optimization failed:', error);
        showError('analyzeError', 'Lỗi xử lý ảnh. Vui lòng thử lại.');
    }
}

// ============== STEP 1: ANALYZE SKETCH ==============
async function analyzeSketch() {
    if (!currentSketchImage) {
        showError('analyzeError', 'Vui lòng upload ảnh sketch trước!');
        return;
    }

    if (isAnalyzing) {
        console.warn('⚠️ Analysis already in progress');
        return;
    }

    isAnalyzing = true;
    showSpinner('analyzeSpinner', true);
    if (analyzeButton) analyzeButton.disabled = true;
    hideError('analyzeError');
    hideSuccess('analyzeSuccess');

    try {
        console.log('📊 Analyzing interior sketch...');

        const response = await fetch(`${API_BASE_URL}/analyze-sketch-interior`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image_base64: currentSketchImage
            })
        });

        if (!response.ok) {
            let errorMsg = `HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error) errorMsg = errorData.error;
            } catch (e) { }
            throw new Error(errorMsg);
        }

        currentAnalysisData = await response.json();
        console.log('✅ Interior analysis complete:', currentAnalysisData);

        fillFormFromAnalysis(currentAnalysisData);
        await translatePrompt();

        showSuccess('analyzeSuccess', '✨ Phân tích thành công! Vui lòng kiểm tra thông số.');

    } catch (error) {
        console.error('❌ Analysis failed:', error);
        showError('analyzeError', `Lỗi phân tích: ${error.message}`);
    } finally {
        showSpinner('analyzeSpinner', false);
        if (analyzeButton) analyzeButton.disabled = false;
        isAnalyzing = false;
    }
}

// ============== FILL FORM FROM ANALYSIS ==============
function fillFormFromAnalysis(data) {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    // Basic info
    setVal('room_type', data.room_type);
    setVal('interior_style', data.interior_style);

    // Flooring (single object)
    if (data.flooring) {
        setVal('flooring_type', data.flooring.type);
        setVal('flooring_description', data.flooring.description);
        setVal('flooring_rug', data.flooring.rug_carpet);
    }

    // Ceiling (single object)
    if (data.ceiling) {
        setVal('ceiling_type', data.ceiling.type);
        setVal('ceiling_lighting', data.ceiling.lighting_system);
    }

    // Environment
    if (data.environment) {
        const atmosphere = data.environment.find(e => e.type === 'Bầu không khí (atmosphere)');
        const time = data.environment.find(e => e.type === 'Thời điểm (time_of_day)');
        if (atmosphere) setVal('env_atmosphere', atmosphere.description);
        if (time) setVal('env_time', time.description);
    }

    // Technical specs
    if (data.technical_specs) {
        setVal('tech_camera', data.technical_specs.camera);
        setVal('tech_lens', data.technical_specs.lens);
        setVal('tech_lighting_emphasis', data.technical_specs.lighting_emphasis);
        setVal('tech_contrast', data.technical_specs.contrast_boost);
        setVal('tech_sharpness', data.technical_specs.sharpness);
    }

    // Dynamic arrays
    const furnitureContainer = document.getElementById('furnitureLayoutContainer');
    if (furnitureContainer && data.furniture_layout) {
        furnitureContainer.innerHTML = '';
        data.furniture_layout.forEach(item => {
            addDynamicItem(furnitureContainer, 'furniture', item);
        });
    }

    const wallsContainer = document.getElementById('wallTreatmentsContainer');
    if (wallsContainer && data.wall_treatments) {
        wallsContainer.innerHTML = '';
        data.wall_treatments.forEach(item => {
            addDynamicItem(wallsContainer, 'wall', item);
        });
    }

    const lightingContainer = document.getElementById('lightingContainer');
    if (lightingContainer && data.lighting) {
        lightingContainer.innerHTML = '';
        data.lighting.forEach(item => {
            addDynamicItem(lightingContainer, 'lighting', item);
        });
    }

    const decorationsContainer = document.getElementById('decorationsContainer');
    if (decorationsContainer && data.decorations) {
        decorationsContainer.innerHTML = '';
        data.decorations.forEach(item => {
            addDynamicItem(decorationsContainer, 'decoration', item);
        });
    }

    const windowsDoorsContainer = document.getElementById('windowsDoorsContainer');
    if (windowsDoorsContainer && data.windows_doors) {
        windowsDoorsContainer.innerHTML = '';
        data.windows_doors.forEach(item => {
            addDynamicItem(windowsDoorsContainer, 'window_door', item);
        });
    }
}

// ============== DYNAMIC CONTAINERS ==============
function setupDynamicContainers() {
    // Containers are set up via event delegation in setupEventListeners
    console.log('✅ Dynamic containers ready');
}

function addDynamicItem(container, type, data = null) {
    const item = document.createElement('div');
    item.className = 'dynamic-item';

    let html = '';

    switch (type) {
        case 'furniture':
            html = `
                <div class="form-group">
                    <label>Loại đồ nội thất:</label>
                    <input type="text" class="furniture-object_type" placeholder="VD: Sofa, Bàn trà, Ghế..." value="${data?.object_type || ''}">
                </div>
                <div class="form-group">
                    <label>Vị trí:</label>
                    <input type="text" class="furniture-position" placeholder="VD: Trung tâm phòng, Góc trái..." value="${data?.position || ''}">
                </div>
                <div class="form-group">
                    <label>Mô tả chi tiết:</label>
                    <textarea class="furniture-description" rows="2" placeholder="Hình dạng, kích thước, màu sắc...">${data?.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Chất liệu:</label>
                    <input type="text" class="furniture-material" placeholder="VD: Vải linen màu be, Da bò nâu..." value="${data?.material || ''}">
                </div>
                <button type="button" class="btn-remove" onclick="this.parentElement.remove()">× Xóa</button>
            `;
            break;

        case 'wall':
            html = `
                <div class="form-group">
                    <label>Vị trí tường:</label>
                    <input type="text" class="wall-location" placeholder="VD: Tường sau sofa, Tường bên trái..." value="${data?.wall_location || ''}">
                </div>
                <div class="form-group">
                    <label>Vật liệu:</label>
                    <input type="text" class="wall-materials" placeholder="VD: Lam gỗ óc chó + Đá marble + Gạch thẻ..." value="${data?.materials || ''}">
                </div>
                <div class="form-group">
                    <label>Mô tả chi tiết:</label>
                    <textarea class="wall-description" rows="2" placeholder="Cách phối hợp vật liệu, màu sắc...">${data?.description || ''}</textarea>
                </div>
                <button type="button" class="btn-remove" onclick="this.parentElement.remove()">× Xóa</button>
            `;
            break;

        case 'lighting':
            html = `
                <div class="form-group">
                    <label>Loại ánh sáng:</label>
                    <input type="text" class="lighting-type" placeholder="VD: Đèn hắt trần, Ánh sáng tự nhiên..." value="${data?.type || ''}">
                </div>
                <div class="form-group">
                    <label>Mô tả chi tiết:</label>
                    <textarea class="lighting-description" rows="2" placeholder="Màu ánh sáng, cường độ, hướng chiếu...">${data?.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Mức độ quan trọng:</label>
                    <select class="lighting-importance">
                        <option value="primary" ${data?.importance === 'primary' ? 'selected' : ''}>Primary (Chính)</option>
                        <option value="secondary" ${data?.importance === 'secondary' ? 'selected' : ''}>Secondary (Phụ)</option>
                        <option value="accent" ${data?.importance === 'accent' ? 'selected' : ''}>Accent (Điểm nhấn)</option>
                    </select>
                </div>
                <button type="button" class="btn-remove" onclick="this.parentElement.remove()">× Xóa</button>
            `;
            break;

        case 'decoration':
            html = `
                <div class="form-group">
                    <label>Loại đồ trang trí:</label>
                    <input type="text" class="decoration-type" placeholder="VD: Tranh, Tượng, Cây cảnh, Sách..." value="${data?.type || ''}">
                </div>
                <div class="form-group">
                    <label>Vị trí:</label>
                    <input type="text" class="decoration-location" placeholder="VD: Trên tường, Trên bàn..." value="${data?.location || ''}">
                </div>
                <div class="form-group">
                    <label>Mô tả:</label>
                    <textarea class="decoration-description" rows="2" placeholder="Màu sắc, kích thước, chất liệu...">${data?.description || ''}</textarea>
                </div>
                <button type="button" class="btn-remove" onclick="this.parentElement.remove()">× Xóa</button>
            `;
            break;

        case 'window_door':
            html = `
                <div class="form-group">
                    <label>Loại:</label>
                    <input type="text" class="window_door-type" placeholder="VD: Cửa sổ kính lớn, Cửa đi gỗ..." value="${data?.type || ''}">
                </div>
                <div class="form-group">
                    <label>Vị trí:</label>
                    <input type="text" class="window_door-location" placeholder="VD: Bên trái phòng, Phía sau..." value="${data?.location || ''}">
                </div>
                <div class="form-group">
                    <label>Mô tả:</label>
                    <textarea class="window_door-description" rows="2" placeholder="Khung, kính, rèm cửa...">${data?.description || ''}</textarea>
                </div>
                <button type="button" class="btn-remove" onclick="this.parentElement.remove()">× Xóa</button>
            `;
            break;
    }

    item.innerHTML = html;
    container.appendChild(item);
}

// ============== COLLECT FORM DATA ==============
function collectFormData() {
    const data = {
        room_type: document.getElementById('room_type')?.value || '',
        interior_style: document.getElementById('interior_style')?.value || '',
        room_dimensions: '', // Optional, not in form

        furniture_layout: [],
        wall_treatments: [],
        flooring: {
            type: document.getElementById('flooring_type')?.value || '',
            description: document.getElementById('flooring_description')?.value || '',
            rug_carpet: document.getElementById('flooring_rug')?.value || ''
        },
        ceiling: {
            type: document.getElementById('ceiling_type')?.value || '',
            lighting_system: document.getElementById('ceiling_lighting')?.value || ''
        },
        lighting: [],
        decorations: [],
        windows_doors: [],
        environment: [],
        style_keywords: document.getElementById('style_keywords')?.value || '',
        negative_prompt: document.getElementById('negative_prompt')?.value || '',
        technical_specs: {
            camera: document.getElementById('tech_camera')?.value || '',
            lens: document.getElementById('tech_lens')?.value || '',
            lighting_emphasis: document.getElementById('tech_lighting_emphasis')?.value || '',
            contrast_boost: document.getElementById('tech_contrast')?.value || '',
            sharpness: document.getElementById('tech_sharpness')?.value || ''
        }
    };

    // Collect furniture layout
    document.querySelectorAll('#furnitureLayoutContainer .dynamic-item').forEach(item => {
        data.furniture_layout.push({
            object_type: item.querySelector('.furniture-object_type')?.value || '',
            position: item.querySelector('.furniture-position')?.value || '',
            description: item.querySelector('.furniture-description')?.value || '',
            material: item.querySelector('.furniture-material')?.value || ''
        });
    });

    // Collect wall treatments
    document.querySelectorAll('#wallTreatmentsContainer .dynamic-item').forEach(item => {
        data.wall_treatments.push({
            wall_location: item.querySelector('.wall-location')?.value || '',
            materials: item.querySelector('.wall-materials')?.value || '',
            description: item.querySelector('.wall-description')?.value || ''
        });
    });

    // Collect lighting
    document.querySelectorAll('#lightingContainer .dynamic-item').forEach(item => {
        data.lighting.push({
            type: item.querySelector('.lighting-type')?.value || '',
            description: item.querySelector('.lighting-description')?.value || '',
            importance: item.querySelector('.lighting-importance')?.value || 'secondary'
        });
    });

    // Collect decorations
    document.querySelectorAll('#decorationsContainer .dynamic-item').forEach(item => {
        data.decorations.push({
            type: item.querySelector('.decoration-type')?.value || '',
            location: item.querySelector('.decoration-location')?.value || '',
            description: item.querySelector('.decoration-description')?.value || ''
        });
    });

    // Collect windows/doors
    document.querySelectorAll('#windowsDoorsContainer .dynamic-item').forEach(item => {
        data.windows_doors.push({
            type: item.querySelector('.window_door-type')?.value || '',
            location: item.querySelector('.window_door-location')?.value || '',
            description: item.querySelector('.window_door-description')?.value || ''
        });
    });

    // Collect environment
    const atmosphere = document.getElementById('env_atmosphere')?.value;
    const time = document.getElementById('env_time')?.value;
    if (atmosphere) {
        data.environment.push({
            type: 'atmosphere',
            description: atmosphere
        });
    }
    if (time) {
        data.environment.push({
            type: 'time_of_day',
            description: time
        });
    }

    return data;
}

// ============== STEP 2: TRANSLATE PROMPT ==============
async function translatePrompt() {
    if (isTranslating) return;
    isTranslating = true;
    const formData = collectFormData();

    try {
        console.log('🌐 Translating to English...');

        const response = await fetch(`${API_BASE_URL}/translate-prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                form_data: formData
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        currentTranslatedData = result.translated_data_en;

        console.log('✅ Translation complete');

        if (generateButton) {
            generateButton.disabled = false;
        }

    } catch (error) {
        console.error('❌ Translation failed:', error);
        showError('analyzeError', `Lỗi dịch: ${error.message}`);
    } finally {
        isTranslating = false;
    }
}

// ============== STEP 3: GENERATE RENDER ==============
async function generateRender() {
    if (!currentSketchImage) {
        showError('renderError', 'Vui lòng upload và phân tích sketch trước!');
        return;
    }

    if (isRendering) {
        console.warn('⚠️ Rendering already in progress');
        return;
    }

    isRendering = true;
    showSpinner('renderSpinner', true);
    if (generateButton) generateButton.disabled = true;
    hideError('renderError');
    hideSuccess('renderSuccess');

    const startTime = Date.now();

    try {
        console.log('🎨 Generating render...');

        const formData = collectFormData();
        const aspectRatio = document.getElementById('aspect_ratio')?.value || '16:9';
        const sketchAdherence = parseFloat(document.getElementById('sketch_adherence')?.value) || 0.99;

        const requestBody = {
            image_base64: currentSketchImage,
            form_data_vi: formData,
            aspect_ratio: aspectRatio,
            viewpoint: 'eye_level',
            sketch_adherence: sketchAdherence
        };

        // Add reference image if exists
        if (currentReferenceImage) {
            requestBody.reference_image_base64 = currentReferenceImage;
        }

        const response = await fetch(`${API_BASE_URL}/render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let errorMsg = `HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error) errorMsg = errorData.error;
            } catch (e) { }
            throw new Error(errorMsg);
        }

        const result = await response.json();
        currentRenderedImage = result.generated_image_base64;

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        displayRenderedImage(currentRenderedImage, elapsed);
        showSuccess('renderSuccess', '✨ Render thành công!');

    } catch (error) {
        console.error('❌ Render failed:', error);
        showError('renderError', `Lỗi render: ${error.message}`);
    } finally {
        showSpinner('renderSpinner', false);
        if (generateButton) generateButton.disabled = false;
        isRendering = false;
    }
}

// ============== DISPLAY RENDERED IMAGE ==============
function displayRenderedImage(imageBase64, elapsedTime) {
    if (!gallery) return;

    gallery.innerHTML = `
        <img src="${imageBase64}" alt="Rendered interior" class="rendered-image" style="width: 100%; border-radius: 8px; cursor: pointer;">
    `;

    // Click to view full size
    const img = gallery.querySelector('.rendered-image');
    if (img) {
        img.addEventListener('click', () => {
            if (imagePreviewModal) {
                imagePreviewModal.show(imageBase64);
            }
        });
    }

    // Show controls
    const outputControls = document.getElementById('outputControls');
    if (outputControls) {
        outputControls.classList.remove('hidden');
    }

    // Show stats
    const statsBox = document.getElementById('statsBox');
    const statTime = document.getElementById('statTime');
    if (statsBox && statTime) {
        statTime.textContent = `${elapsedTime}s`;
        statsBox.classList.remove('hidden');
    }
}

// ============== DOWNLOAD IMAGE ==============
function handleDownloadImage() {
    if (!currentRenderedImage) return;

    const link = document.createElement('a');
    link.href = currentRenderedImage;
    link.download = `interior-render-${Date.now()}.png`;
    link.click();

    console.log('💾 Image downloaded');
}

// ============== EXPORT JSON ==============
function setupExportButton() {
    const exportBtn = document.createElement('button');
    exportBtn.id = 'exportJSONButton';
    exportBtn.className = 'btn-secondary';
    exportBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="12" y2="18"/>
            <line x1="15" y1="15" x2="12" y2="18"/>
        </svg>
        Export JSON
    `;
    exportBtn.addEventListener('click', exportToJSON);

    const outputActions = document.querySelector('.output-actions');
    if (outputActions) {
        outputActions.insertBefore(exportBtn, outputActions.firstChild);
    }
}

function exportToJSON() {
    const formData = collectFormData();
    const aspectRatio = document.getElementById('aspect_ratio')?.value || '16:9';
    const sketchAdherence = parseFloat(document.getElementById('sketch_adherence')?.value) || 0.99;

    const exportData = {
        form_data: formData,
        translated_data: currentTranslatedData,
        settings: {
            aspect_ratio: aspectRatio,
            sketch_adherence: sketchAdherence
        },
        date: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `interior-config-${Date.now()}.json`;
    link.click();

    console.log('📦 JSON exported');
}

// ============== UTILITY FUNCTIONS ==============
function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.classList.remove('hidden');
    }
}

function hideError(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.add('hidden');
    }
}

function showSuccess(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.classList.remove('hidden');
    }
}

function hideSuccess(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.add('hidden');
    }
}

function showSpinner(spinnerId, show) {
    const spinner = document.getElementById(spinnerId);
    if (spinner) {
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }
}
