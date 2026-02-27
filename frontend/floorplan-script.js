/**
 * floorplan-script.js - 2D Floor Plan Material Render
 * Upload floor plan → AI analysis → user edits → render with top-down view
 */

const API_BASE = 'http://localhost:5001/api';

let floorplanB64 = null;
let referenceB64 = null;
let analysisData = null;
let selectedStyle = 'modern';
let selectedRatio = '1:1';
let roomIdCounter = 0;

const FLOOR_MATERIALS = ['Gỗ sồi', 'Gỗ óc chó', 'Gạch men trắng', 'Đá marble', 'Gạch cement', 'Gỗ công nghiệp', 'Đá tự nhiên', 'Thảm', 'Epoxy'];
const WALL_COLORS = ['Trắng ngà', 'Xám nhạt', 'Xanh sage', 'Kem be', 'Nâu gỗ nhạt', 'Xanh navy', 'Hồng blush', 'Xám bê tông'];
const ROOM_TYPES = ['Phòng khách', 'Phòng ngủ chính', 'Phòng ngủ 2', 'Phòng ngủ 3', 'Nhà bếp', 'Phòng tắm / WC', 'WC', 'Phòng làm việc', 'Phòng ăn', 'Hành lang', 'Kho', 'Ban công', 'Logia', 'Phòng tiện ích'];

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Style options
    document.querySelectorAll('.style-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.style-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            selectedStyle = opt.dataset.style;
        });
    });

    // Aspect ratio
    document.querySelectorAll('.aspect-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.aspect-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedRatio = btn.dataset.ratio;
        });
    });

    // Floor plan upload
    document.getElementById('uploadFP').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        readFileAsBase64(file, b64 => {
            floorplanB64 = b64;
            const preview = document.getElementById('previewFP');
            preview.src = b64;
            preview.classList.remove('hidden');
            document.getElementById('uploadFPLabel').style.display = 'none';
            document.getElementById('analyzeBtn').disabled = false;
            document.getElementById('clearFPBtn').style.display = 'inline-flex';
            checkCanRender();
        });
    });

    // Clear floor plan
    document.getElementById('clearFPBtn').addEventListener('click', () => {
        floorplanB64 = null;
        analysisData = null;
        document.getElementById('previewFP').src = '';
        document.getElementById('previewFP').classList.add('hidden');
        document.getElementById('uploadFPLabel').style.display = '';
        document.getElementById('clearFPBtn').style.display = 'none';
        document.getElementById('analyzeBtn').disabled = true;
        document.getElementById('uploadFP').value = '';
        checkCanRender();
    });

    // Reference upload
    document.getElementById('uploadRef').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        readFileAsBase64(file, b64 => {
            referenceB64 = b64;
            document.getElementById('previewRef').src = b64;
            document.getElementById('previewRef').classList.remove('hidden');
            document.getElementById('uploadRefLabel').style.display = 'none';
            document.getElementById('clearRefBtn').style.display = 'flex';
        });
    });

    document.getElementById('clearRefBtn').addEventListener('click', () => {
        referenceB64 = null;
        document.getElementById('previewRef').src = '';
        document.getElementById('previewRef').classList.add('hidden');
        document.getElementById('uploadRefLabel').style.display = '';
        document.getElementById('clearRefBtn').style.display = 'none';
        document.getElementById('uploadRef').value = '';
    });

    // Analyze button
    document.getElementById('analyzeBtn').addEventListener('click', analyzeFloorplan);

    // Add room manually
    document.getElementById('addRoomBtn').addEventListener('click', () => addRoomCard());

    // Render button
    document.getElementById('renderBtn').addEventListener('click', renderFloorplan);
    document.getElementById('retryBtn')?.addEventListener('click', renderFloorplan);
});

// ── AI Analysis ───────────────────────────────────────────────────────────────

async function analyzeFloorplan() {
    if (!floorplanB64) return;
    const btn = document.getElementById('analyzeBtn');
    const status = document.getElementById('analyzeStatus');

    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-rounded spinning">autorenew</span> Đang phân tích...';
    status.style.display = 'block';
    status.textContent = 'AI đang nhận diện các phòng và đồ vật... (15-30 giây)';

    try {
        const res = await fetch(`${API_BASE}/floorplan/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_base64: floorplanB64 })
        });

        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

        analysisData = data.analysis;

        // Fill form with analysis
        document.getElementById('aptType').value = analysisData.apartment_type || '';
        document.getElementById('aptSize').value = analysisData.overall_size || '';

        // Build room cards
        const rooms = analysisData.rooms || [];
        document.getElementById('roomsList').innerHTML = '';
        roomIdCounter = 0;
        rooms.forEach(room => addRoomCard(room));

        status.textContent = `✅ Phân tích xong: ${rooms.length} phòng được nhận diện. Kiểm tra và chỉnh sửa nếu cần.`;
        status.style.color = 'var(--color-success)';
        checkCanRender();

    } catch (err) {
        status.textContent = '❌ Lỗi phân tích: ' + err.message;
        status.style.color = 'var(--color-error)';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-rounded">psychology</span> Phân tích lại';
    }
}

// ── Room Cards ────────────────────────────────────────────────────────────────

function addRoomCard(roomData = null) {
    const id = ++roomIdCounter;
    const room = roomData || {};

    const roomType = room.room_type || 'Phòng';
    const floorMat = room.floor_material || '';
    const wallColor = room.wall_color || '';
    const objects = (room.objects || []).join(', ');
    const specials = (room.special_elements || []).join(', ');

    const roomTypeOptions = ROOM_TYPES.map(t =>
        `<option value="${t}" ${t === roomType ? 'selected' : ''}>${t}</option>`
    ).join('');

    const floorOptions = FLOOR_MATERIALS.map(m =>
        `<option value="${m}" ${m === floorMat ? 'selected' : ''}>${m}</option>`
    ).join('');

    const wallOptions = WALL_COLORS.map(c =>
        `<option value="${c}" ${c === wallColor ? 'selected' : ''}>${c}</option>`
    ).join('');

    const card = document.createElement('div');
    card.className = 'room-card';
    card.dataset.roomId = id;
    card.innerHTML = `
        <div class="room-card-header">
            <select class="room-type-select" style="font-size:0.82rem; font-weight:600; border:none; background:none; color:var(--color-text-primary); padding:0; cursor:pointer;">
                ${roomTypeOptions}
            </select>
            <div style="display:flex; align-items:center; gap:0.4rem;">
                <span class="room-tag">#${id}</span>
                <button class="btn-icon-sm danger" onclick="removeRoom(${id})" title="Xóa phòng">
                    <span class="material-symbols-rounded" style="font-size:14px;">close</span>
                </button>
            </div>
        </div>
        <div class="room-grid">
            <div class="room-field">
                <label>Sàn</label>
                <select class="floor-mat-select">
                    <option value="">-- Chọn --</option>
                    ${floorOptions}
                </select>
            </div>
            <div class="room-field">
                <label>Màu tường</label>
                <select class="wall-color-select">
                    <option value="">-- Chọn --</option>
                    ${wallOptions}
                </select>
            </div>
        </div>
        <div class="room-objects">
            <label>Đồ vật trong phòng</label>
            <input type="text" class="room-objects-input" value="${objects}" placeholder="VD: Sofa, Bàn trà, TV...">
        </div>
        ${specials ? `<div style="font-size:0.72rem; color:var(--color-text-tertiary); margin-top:0.4rem;">📌 ${specials}</div>` : ''}
    `;

    document.getElementById('roomsList').appendChild(card);
    updateRoomCount();
}

function removeRoom(id) {
    const card = document.querySelector(`[data-room-id="${id}"]`);
    if (card) { card.remove(); updateRoomCount(); }
}

function updateRoomCount() {
    const count = document.querySelectorAll('.room-card').length;
    document.getElementById('roomCount').textContent = `(${count} phòng)`;
}

function collectRoomsData() {
    const cards = document.querySelectorAll('.room-card');
    return Array.from(cards).map(card => ({
        room_type: card.querySelector('.room-type-select')?.value || '',
        floor_material: card.querySelector('.floor-mat-select')?.value || '',
        wall_color: card.querySelector('.wall-color-select')?.value || '',
        objects: (card.querySelector('.room-objects-input')?.value || '')
            .split(',').map(s => s.trim()).filter(Boolean)
    }));
}

// ── Render ────────────────────────────────────────────────────────────────────

async function renderFloorplan() {
    if (!floorplanB64) {
        showStatus('Vui lòng upload ảnh mặt bằng.', 'error');
        return;
    }

    const rooms = collectRoomsData();
    const currentAnalysis = {
        apartment_type: document.getElementById('aptType').value || 'Residential',
        overall_size: document.getElementById('aptSize').value || '',
        rooms
    };

    setLoading(true);
    showStatus('Đang render mặt bằng... (60-120 giây)', 'info');

    try {
        const payload = {
            image_base64: floorplanB64,
            analysis_data: currentAnalysis,
            style: selectedStyle,
            color_scheme: document.getElementById('colorScheme').value.trim(),
            aspect_ratio: selectedRatio
        };
        if (referenceB64) payload.reference_image_base64 = referenceB64;

        const res = await fetch(`${API_BASE}/floorplan/render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

        const resultSrc = `data:image/png;base64,${data.generated_image_base64}`;
        document.getElementById('outputImage').src = resultSrc;
        document.getElementById('outputPlaceholder').style.display = 'none';
        document.getElementById('outputContainer').style.display = 'block';

        document.getElementById('downloadBtn').onclick = () => downloadImage(resultSrc);
        showStatus('Render hoàn thành!', 'success');

    } catch (err) {
        showStatus('Lỗi: ' + err.message, 'error');
    } finally {
        setLoading(false);
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function checkCanRender() {
    document.getElementById('renderBtn').disabled = !floorplanB64;
}

function setLoading(loading) {
    const btn = document.getElementById('renderBtn');
    btn.disabled = loading;
    btn.innerHTML = loading
        ? '<span class="material-symbols-rounded spinning">autorenew</span> Đang render...'
        : '<span class="material-symbols-rounded">auto_awesome</span> Render Mặt Bằng';
}

function showStatus(msg, type = 'info') {
    const el = document.getElementById('renderStatus');
    el.style.display = 'block';
    el.className = `status-message status-${type}`;
    el.textContent = msg;
}

function readFileAsBase64(file, callback) {
    const reader = new FileReader();
    reader.onload = e => callback(e.target.result);
    reader.readAsDataURL(file);
}

function downloadImage(src) {
    const a = document.createElement('a');
    a.href = src;
    a.download = `floorplan_render_${Date.now()}.png`;
    a.click();
}
