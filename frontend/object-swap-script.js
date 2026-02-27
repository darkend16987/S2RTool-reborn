/**
 * object-swap-script.js - Object Swap Feature
 * Approach 1.2: source image + drawn mask + reference object photo
 */

const API_BASE = 'http://localhost:5001/api';

// State
let sourceImageB64 = null;
let refObjectB64 = null;
let currentTool = 'brush'; // 'brush' | 'eraser'
let brushSize = 10;
let isDrawing = false;
let lastX = 0, lastY = 0;

// DOM refs
const sourceUploader = document.getElementById('sourceUploader');
const uploadSource = document.getElementById('uploadSource');
const maskSection = document.getElementById('maskSection');
const sourceImg = document.getElementById('sourceImg');
const maskCanvas = document.getElementById('maskCanvas');
const canvasContainer = document.getElementById('canvasContainer');
const ctx = maskCanvas.getContext('2d');

const uploadRefObj = document.getElementById('uploadRefObj');
const previewRefObj = document.getElementById('previewRefObj');
const clearRefObjBtn = document.getElementById('clearRefObjBtn');
const uploadRefObjLabel = document.getElementById('uploadRefObjLabel');

const toolBrush = document.getElementById('toolBrush');
const toolEraser = document.getElementById('toolEraser');
const toolClear = document.getElementById('toolClear');
const brushDots = document.querySelectorAll('.brush-dot');

const renderBtn = document.getElementById('renderBtn');
const renderStatus = document.getElementById('renderStatus');
const outputPlaceholder = document.getElementById('outputPlaceholder');
const outputContainer = document.getElementById('outputContainer');
const outputImage = document.getElementById('outputImage');
const downloadBtn = document.getElementById('downloadBtn');
const retryBtn = document.getElementById('retryBtn');

// ── Source Image Upload ───────────────────────────────────────────────────────

uploadSource.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    readFileAsBase64(file, b64 => {
        sourceImageB64 = b64;
        sourceImg.src = b64;
        sourceImg.onload = () => initCanvas();
        maskSection.style.display = 'block';
        sourceUploader.style.display = 'none';
        checkCanRender();
    });
});

function initCanvas() {
    // Size canvas to match displayed image
    const rect = sourceImg.getBoundingClientRect();
    maskCanvas.width = rect.width || sourceImg.naturalWidth;
    maskCanvas.height = rect.height || sourceImg.naturalHeight;
    // Fill with transparent black
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
}

// ── Canvas Drawing ────────────────────────────────────────────────────────────

maskCanvas.addEventListener('mousedown', startDraw);
maskCanvas.addEventListener('mousemove', draw);
maskCanvas.addEventListener('mouseup', stopDraw);
maskCanvas.addEventListener('mouseleave', stopDraw);

// Touch support
maskCanvas.addEventListener('touchstart', e => { e.preventDefault(); const t = e.touches[0]; startDraw(toMouse(t)); });
maskCanvas.addEventListener('touchmove', e => { e.preventDefault(); const t = e.touches[0]; draw(toMouse(t)); });
maskCanvas.addEventListener('touchend', stopDraw);

function toMouse(touch) {
    const rect = maskCanvas.getBoundingClientRect();
    return { offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top };
}

function startDraw(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
    drawPoint(lastX, lastY);
}

function draw(e) {
    if (!isDrawing) return;
    drawLine(lastX, lastY, e.offsetX, e.offsetY);
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDraw() { isDrawing = false; }

function drawPoint(x, y) {
    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
    // Draw in RED on canvas (for visibility), but actual mask is derived separately
    ctx.fillStyle = currentTool === 'eraser' ? 'rgba(0,0,0,1)' : 'rgba(220, 38, 38, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawLine(x1, y1, x2, y2) {
    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = currentTool === 'eraser' ? 'rgba(0,0,0,1)' : 'rgba(220, 38, 38, 0.9)';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    drawPoint(x2, y2);
}

// ── Tool Buttons ──────────────────────────────────────────────────────────────

toolBrush.addEventListener('click', () => {
    currentTool = 'brush';
    toolBrush.classList.add('active');
    toolEraser.classList.remove('active');
});

toolEraser.addEventListener('click', () => {
    currentTool = 'eraser';
    toolEraser.classList.add('active');
    toolBrush.classList.remove('active');
});

toolClear.addEventListener('click', () => {
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
});

brushDots.forEach(dot => {
    dot.addEventListener('click', () => {
        brushDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        brushSize = parseInt(dot.dataset.size);
    });
});

// Resize canvas when window resizes
window.addEventListener('resize', () => {
    if (!sourceImg.src || sourceImg.src === window.location.href) return;
    const imageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    initCanvas();
    ctx.putImageData(imageData, 0, 0);
});

// ── Reference Object Upload ───────────────────────────────────────────────────

uploadRefObj.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    readFileAsBase64(file, b64 => {
        refObjectB64 = b64;
        previewRefObj.src = b64;
        previewRefObj.classList.remove('hidden');
        uploadRefObjLabel.style.display = 'none';
        clearRefObjBtn.style.display = 'flex';
    });
});

clearRefObjBtn.addEventListener('click', () => {
    refObjectB64 = null;
    previewRefObj.src = '';
    previewRefObj.classList.add('hidden');
    uploadRefObjLabel.style.display = '';
    clearRefObjBtn.style.display = 'none';
    uploadRefObj.value = '';
});

// ── Validate + Render ─────────────────────────────────────────────────────────

function checkCanRender() {
    renderBtn.disabled = !sourceImageB64;
}

renderBtn.addEventListener('click', async () => {
    if (!sourceImageB64) {
        showStatus('Vui lòng upload ảnh nguồn trước.', 'error');
        return;
    }

    // Check if mask has any painted area
    const hasMask = checkMaskHasPaint();
    if (!hasMask) {
        showStatus('Vui lòng tô vùng đồ vật cần thay trên ảnh.', 'error');
        return;
    }

    const instruction = document.getElementById('swapInstruction').value.trim();
    if (!refObjectB64 && !instruction) {
        showStatus('Cần upload ảnh đồ vật mới HOẶC điền mô tả đồ vật cần thay.', 'error');
        return;
    }

    const preserveMode = document.querySelector('input[name="preserveMode"]:checked').value;

    // Generate mask image from canvas
    const maskB64 = generateMaskBase64();

    setLoading(true);
    showStatus('Đang xử lý... (30-90 giây)', 'info');

    try {
        const payload = {
            source_image_base64: sourceImageB64,
            mask_image_base64: maskB64,
            preserve_mode: preserveMode
        };
        if (refObjectB64) payload.reference_object_base64 = refObjectB64;
        if (instruction) payload.swap_instruction = instruction;

        const res = await fetch(`${API_BASE}/object-swap/render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            throw new Error(data.error || `HTTP ${res.status}`);
        }

        const resultSrc = `data:image/png;base64,${data.result_image_base64}`;
        outputImage.src = resultSrc;
        outputPlaceholder.style.display = 'none';
        outputContainer.style.display = 'block';

        downloadBtn.onclick = () => downloadImage(resultSrc);
        showStatus('Swap hoàn thành!', 'success');

    } catch (err) {
        showStatus('Lỗi: ' + err.message, 'error');
    } finally {
        setLoading(false);
    }
});

retryBtn.addEventListener('click', () => renderBtn.click());

// ── Helpers ───────────────────────────────────────────────────────────────────

function checkMaskHasPaint() {
    const data = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
    for (let i = 0; i < data.length; i += 4) {
        // Check for red channel (our brush color is red)
        if (data[i] > 100 && data[i + 1] < 100) return true;
    }
    return false;
}

function generateMaskBase64() {
    // Create a pure B&W mask canvas from the drawn canvas
    const bwCanvas = document.createElement('canvas');
    bwCanvas.width = maskCanvas.width;
    bwCanvas.height = maskCanvas.height;
    const bwCtx = bwCanvas.getContext('2d');

    // Black background
    bwCtx.fillStyle = 'black';
    bwCtx.fillRect(0, 0, bwCanvas.width, bwCanvas.height);

    // Get drawn pixels and convert to white where painted (red)
    const srcData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const dstData = bwCtx.getImageData(0, 0, bwCanvas.width, bwCanvas.height);

    for (let i = 0; i < srcData.data.length; i += 4) {
        const r = srcData.data[i];
        const g = srcData.data[i + 1];
        const b = srcData.data[i + 2];
        const a = srcData.data[i + 3];
        // Painted area has high red, low green
        if (a > 50 && r > 100 && g < 100) {
            dstData.data[i] = 255;
            dstData.data[i + 1] = 255;
            dstData.data[i + 2] = 255;
            dstData.data[i + 3] = 255;
        } else {
            dstData.data[i] = 0;
            dstData.data[i + 1] = 0;
            dstData.data[i + 2] = 0;
            dstData.data[i + 3] = 255;
        }
    }
    bwCtx.putImageData(dstData, 0, 0);

    return bwCanvas.toDataURL('image/png');
}

function readFileAsBase64(file, callback) {
    const reader = new FileReader();
    reader.onload = e => callback(e.target.result);
    reader.readAsDataURL(file);
}

function setLoading(loading) {
    renderBtn.disabled = loading;
    renderBtn.innerHTML = loading
        ? '<span class="material-symbols-rounded spinning">autorenew</span> Đang xử lý...'
        : '<span class="material-symbols-rounded">auto_awesome</span> Thực Hiện Swap';
}

function showStatus(msg, type = 'info') {
    renderStatus.style.display = 'block';
    renderStatus.className = `status-message status-${type}`;
    renderStatus.textContent = msg;
}

function downloadImage(src) {
    const a = document.createElement('a');
    a.href = src;
    a.download = `swap_${Date.now()}.png`;
    a.click();
}
