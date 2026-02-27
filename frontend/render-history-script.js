/**
 * render-history-script.js - Render History Gallery
 * Loads and displays all saved renders from the backend history API.
 */

const API_BASE = 'http://localhost:5001/api';

let currentMode = '';
let currentPage = 1;
const LIMIT = 24;
let currentModalId = '';
let currentModalMode = '';

const MODE_LABELS = {
    building: 'Building Render',
    interior: 'Interior Render',
    planning: 'Planning Render',
    planning_detail: 'Planning Detail',
    object_swap: 'Object Swap',
    floorplan: 'Floor Plan'
};

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Mode tabs
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentMode = tab.dataset.mode;
            currentPage = 1;
            loadHistory();
            updateClearButton();
        });
    });

    // Modal close
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('imgModal').addEventListener('click', e => {
        if (e.target === document.getElementById('imgModal')) closeModal();
    });

    // Modal delete
    document.getElementById('modalDelete').addEventListener('click', async () => {
        if (!currentModalId) return;
        if (!confirm('Xóa render này khỏi lịch sử?')) return;
        await deleteRender(currentModalId, currentModalMode);
        closeModal();
        loadHistory();
    });

    // Clear mode button
    document.getElementById('btnClearMode').addEventListener('click', async () => {
        if (!currentMode) return;
        const label = MODE_LABELS[currentMode] || currentMode;
        if (!confirm(`Xóa TẤT CẢ renders của mode "${label}"?\nHành động này không thể hoàn tác.`)) return;
        try {
            const res = await fetch(`${API_BASE}/history/clear?mode=${currentMode}`, { method: 'DELETE' });
            const data = await res.json();
            showNotice(`Đã xóa ${data.deleted} renders`, 'success');
            loadHistory();
        } catch (e) {
            showNotice('Lỗi khi xóa: ' + e.message, 'error');
        }
    });

    // Load stats + history
    loadStats();
    loadHistory();
});

// ── Load History ──────────────────────────────────────────────────────────────

async function loadHistory() {
    const grid = document.getElementById('historyGrid');
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><span class="material-symbols-rounded">hourglass_empty</span><h3>Đang tải...</h3></div>';

    const params = new URLSearchParams({ page: currentPage, limit: LIMIT });
    if (currentMode) params.set('mode', currentMode);

    try {
        const res = await fetch(`${API_BASE}/history/list?${params}`);
        if (!res.ok) throw new Error('API error: ' + res.status);
        const data = await res.json();

        renderGrid(data.items);
        renderPagination(data.page, data.pages, data.total);
        document.getElementById('statsTotal').textContent = `${data.total} renders`;
    } catch (e) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
            <span class="material-symbols-rounded">error_outline</span>
            <h3>Không thể tải lịch sử</h3>
            <p>${e.message}</p>
        </div>`;
    }
}

async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/history/stats`);
        const data = await res.json();
        document.getElementById('statsTotal').textContent = `${data.total} renders`;
    } catch (_) {}
}

// ── Render Grid ───────────────────────────────────────────────────────────────

function renderGrid(items) {
    const grid = document.getElementById('historyGrid');
    if (!items || items.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
            <span class="material-symbols-rounded">image_not_supported</span>
            <h3>Chưa có render nào</h3>
            <p>Các ảnh bạn tạo sẽ xuất hiện ở đây.</p>
        </div>`;
        return;
    }

    grid.innerHTML = items.map(item => renderCard(item)).join('');

    // Attach events
    grid.querySelectorAll('.render-card').forEach(card => {
        const id = card.dataset.id;
        const mode = card.dataset.mode;
        card.addEventListener('click', e => {
            if (e.target.closest('.btn-icon-sm')) return;
            openModal(id, mode, card.querySelector('.render-card-summary').textContent);
        });
        card.querySelector('.btn-download')?.addEventListener('click', e => {
            e.stopPropagation();
            downloadRender(id, mode);
        });
        card.querySelector('.btn-delete')?.addEventListener('click', async e => {
            e.stopPropagation();
            if (!confirm('Xóa render này?')) return;
            await deleteRender(id, mode);
            loadHistory();
        });
    });
}

function renderCard(item) {
    const modeLabel = MODE_LABELS[item.mode] || item.mode;
    const modeClass = `mode-${item.mode}`;
    const timeStr = formatTime(item.timestamp);
    const imgSrc = item.thumbnail_b64
        ? `data:image/jpeg;base64,${item.thumbnail_b64}`
        : 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    const summary = item.prompt_summary || '—';

    return `<div class="render-card" data-id="${item.id}" data-mode="${item.mode}">
        <img class="render-card-img" src="${imgSrc}" alt="${summary}" loading="lazy">
        <div class="render-card-body">
            <span class="render-card-mode ${modeClass}">
                <span class="material-symbols-rounded" style="font-size:12px;">${modeIcon(item.mode)}</span>
                ${modeLabel}
            </span>
            <div class="render-card-summary" title="${summary}">${summary}</div>
            <div class="render-card-time">${timeStr}</div>
            <div class="render-card-actions">
                <button class="btn-icon-sm btn-download" title="Tải về">
                    <span class="material-symbols-rounded">download</span>
                </button>
                <button class="btn-icon-sm danger btn-delete" title="Xóa">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </div>
        </div>
    </div>`;
}

function modeIcon(mode) {
    const icons = {
        building: 'apartment', interior: 'living', planning: 'location_city',
        planning_detail: 'landscape', object_swap: 'find_replace', floorplan: 'floor'
    };
    return icons[mode] || 'image';
}

// ── Pagination ────────────────────────────────────────────────────────────────

function renderPagination(page, pages, total) {
    const container = document.getElementById('pagination');
    if (pages <= 1) { container.style.display = 'none'; return; }
    container.style.display = 'flex';

    let html = `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goPage(${page - 1})">
        <span class="material-symbols-rounded" style="font-size:16px;">chevron_left</span>
    </button>`;

    for (let i = 1; i <= pages; i++) {
        if (pages > 7 && Math.abs(i - page) > 2 && i !== 1 && i !== pages) {
            if (i === page - 3 || i === page + 3) html += `<span class="page-info">…</span>`;
            continue;
        }
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" ${page >= pages ? 'disabled' : ''} onclick="goPage(${page + 1})">
        <span class="material-symbols-rounded" style="font-size:16px;">chevron_right</span>
    </button>
    <span class="page-info">${total} renders</span>`;

    container.innerHTML = html;
}

function goPage(page) {
    currentPage = page;
    loadHistory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Modal ─────────────────────────────────────────────────────────────────────

async function openModal(id, mode, summary) {
    currentModalId = id;
    currentModalMode = mode;
    const modal = document.getElementById('imgModal');
    const modeLabel = MODE_LABELS[mode] || mode;
    document.getElementById('modalTitle').textContent = `${modeLabel} — ${summary}`;
    document.getElementById('modalImg').src = '';

    // Show loading placeholder
    modal.classList.add('active');

    // Try to get full image as data URL via download endpoint
    const imgEl = document.getElementById('modalImg');
    imgEl.src = `${API_BASE}/history/image/${id}${mode ? '?mode=' + mode : ''}`;

    // Set download link
    const dl = document.getElementById('modalDownload');
    dl.href = `${API_BASE}/history/image/${id}${mode ? '?mode=' + mode : ''}`;
    dl.download = `render_${id}.png`;
}

function closeModal() {
    document.getElementById('imgModal').classList.remove('active');
    currentModalId = '';
    currentModalMode = '';
}

// ── Actions ───────────────────────────────────────────────────────────────────

function downloadRender(id, mode) {
    const a = document.createElement('a');
    a.href = `${API_BASE}/history/image/${id}${mode ? '?mode=' + mode : ''}`;
    a.download = `render_${id}.png`;
    a.click();
}

async function deleteRender(id, mode) {
    try {
        const params = mode ? `?mode=${mode}` : '';
        await fetch(`${API_BASE}/history/delete/${id}${params}`, { method: 'DELETE' });
        showNotice('Đã xóa render', 'success');
    } catch (e) {
        showNotice('Lỗi khi xóa: ' + e.message, 'error');
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function updateClearButton() {
    const btn = document.getElementById('btnClearMode');
    btn.style.display = currentMode ? 'inline-flex' : 'none';
}

function formatTime(isoStr) {
    if (!isoStr) return '—';
    try {
        const d = new Date(isoStr);
        const now = new Date();
        const diff = (now - d) / 1000;
        if (diff < 60) return 'Vừa xong';
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (_) { return isoStr; }
}

function showNotice(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `status-message status-${type === 'success' ? 'success' : type === 'error' ? 'error' : 'info'}`;
    el.textContent = msg;
    el.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;max-width:300px;';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}
