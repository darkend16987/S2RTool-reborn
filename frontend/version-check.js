/**
 * S2RTool Version Check System
 * Checks for updates from GitHub releases
 */

const VERSION_CONFIG = {
    currentVersion: '4.0.0',
    repoOwner: 'darkend16987',
    repoName: 'S2RTool-reborn',
    checkInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    cacheKey: 'S2RTool_lastVersionCheck'
};

/**
 * Compare two semantic version strings
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1, v2) {
    const parts1 = v1.replace(/^v/, '').split('.').map(Number);
    const parts2 = v2.replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    return 0;
}

/**
 * Check for updates from GitHub Releases API
 */
async function checkForUpdates(showStatus = false) {
    const statusEl = document.getElementById('updateStatus');

    try {
        // Show loading state if status element exists
        if (statusEl && showStatus) {
            statusEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--color-text-secondary);">
                    <span class="loading"></span>
                    Đang kiểm tra cập nhật...
                </div>
            `;
        }

        // Try GitHub Releases API first
        const response = await fetch(
            `https://api.github.com/repos/${VERSION_CONFIG.repoOwner}/${VERSION_CONFIG.repoName}/releases/latest`,
            {
                headers: { 'Accept': 'application/vnd.github.v3+json' },
                cache: 'no-cache'
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const release = await response.json();
        const latestVersion = release.tag_name.replace(/^v/, '');

        // Save check timestamp
        localStorage.setItem(VERSION_CONFIG.cacheKey, JSON.stringify({
            timestamp: Date.now(),
            latestVersion: latestVersion,
            releaseUrl: release.html_url,
            releaseNotes: release.body
        }));

        // Compare versions
        const comparison = compareVersions(latestVersion, VERSION_CONFIG.currentVersion);

        if (comparison > 0) {
            // New version available
            showUpdateAvailable(latestVersion, release.html_url, release.body, statusEl);
            return { hasUpdate: true, version: latestVersion, url: release.html_url };
        } else {
            // Up to date
            if (statusEl && showStatus) {
                statusEl.innerHTML = `
                    <div class="alert alert-success" style="margin: 0;">
                        <span class="material-symbols-rounded" style="vertical-align: middle;">check_circle</span>
                        Bạn đang sử dụng phiên bản mới nhất (v${VERSION_CONFIG.currentVersion})
                    </div>
                `;
            }
            return { hasUpdate: false, version: VERSION_CONFIG.currentVersion };
        }

    } catch (error) {
        console.warn('Version check failed:', error);

        // Try fallback to version.json
        try {
            const fallbackResponse = await fetch('/version.json', { cache: 'no-cache' });
            if (fallbackResponse.ok) {
                const versionData = await fallbackResponse.json();
                const comparison = compareVersions(versionData.version, VERSION_CONFIG.currentVersion);

                if (comparison > 0) {
                    showUpdateAvailable(
                        versionData.version,
                        versionData.download_url,
                        versionData.release_notes,
                        statusEl
                    );
                    return { hasUpdate: true, version: versionData.version };
                }
            }
        } catch (fallbackError) {
            console.warn('Fallback version check also failed:', fallbackError);
        }

        if (statusEl && showStatus) {
            statusEl.innerHTML = `
                <div class="alert alert-info" style="margin: 0;">
                    <span class="material-symbols-rounded" style="vertical-align: middle;">info</span>
                    Không thể kiểm tra cập nhật. Vui lòng kiểm tra kết nối mạng.
                </div>
            `;
        }
        return { hasUpdate: false, error: error.message };
    }
}

/**
 * Show update available notification
 */
function showUpdateAvailable(version, url, notes, statusEl) {
    if (statusEl) {
        statusEl.innerHTML = `
            <div class="alert alert-info" style="margin: 0;">
                <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                    <span class="material-symbols-rounded" style="color: var(--color-info); font-size: 24px;">upgrade</span>
                    <div style="flex: 1;">
                        <strong>Phiên bản mới v${version} đã có!</strong>
                        <p style="margin: 0.5rem 0; font-size: 0.875rem; color: var(--color-text-secondary);">
                            ${notes ? notes.substring(0, 150) + (notes.length > 150 ? '...' : '') : 'Cập nhật để có các tính năng mới và sửa lỗi.'}
                        </p>
                        <a href="${url}" target="_blank" class="btn btn-primary" style="margin-top: 0.5rem;">
                            <span class="material-symbols-rounded">download</span>
                            Tải về ngay
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // Also show notification banner on all pages
    showUpdateBanner(version, url);
}

/**
 * Show update banner at top of page (for all pages)
 */
function showUpdateBanner(version, url) {
    // Don't show if already dismissed this version
    const dismissedVersion = localStorage.getItem('S2RTool_dismissedUpdate');
    if (dismissedVersion === version) return;

    // Don't show duplicate banners
    if (document.getElementById('updateBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'updateBanner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
        color: white;
        padding: 0.75rem 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 0.875rem;
    `;

    banner.innerHTML = `
        <span class="material-symbols-rounded" style="font-size: 20px;">upgrade</span>
        <span>Phiên bản mới <strong>v${version}</strong> đã có sẵn!</span>
        <a href="${url}" target="_blank" style="
            background: white;
            color: #6366f1;
            padding: 0.375rem 0.75rem;
            border-radius: 0.375rem;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.8rem;
        ">Cập nhật</a>
        <button id="dismissUpdateBanner" style="
            background: transparent;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0.25rem;
            display: flex;
            opacity: 0.8;
        ">
            <span class="material-symbols-rounded" style="font-size: 20px;">close</span>
        </button>
    `;

    document.body.prepend(banner);

    // Add padding to body to prevent content overlap
    document.body.style.paddingTop = banner.offsetHeight + 'px';

    // Dismiss handler
    document.getElementById('dismissUpdateBanner').addEventListener('click', () => {
        localStorage.setItem('S2RTool_dismissedUpdate', version);
        banner.remove();
        document.body.style.paddingTop = '';
    });
}

/**
 * Check if should auto-check based on interval
 */
function shouldAutoCheck() {
    const cached = localStorage.getItem(VERSION_CONFIG.cacheKey);
    if (!cached) return true;

    try {
        const data = JSON.parse(cached);
        const elapsed = Date.now() - data.timestamp;
        return elapsed > VERSION_CONFIG.checkInterval;
    } catch {
        return true;
    }
}

/**
 * Auto-check for updates on page load (with delay)
 */
function initVersionCheck() {
    // Only auto-check if interval has passed
    if (!shouldAutoCheck()) {
        // But still show banner if there's a cached update
        const cached = localStorage.getItem(VERSION_CONFIG.cacheKey);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (compareVersions(data.latestVersion, VERSION_CONFIG.currentVersion) > 0) {
                    showUpdateBanner(data.latestVersion, data.releaseUrl);
                }
            } catch {}
        }
        return;
    }

    // Delay check to not block page load
    setTimeout(() => {
        checkForUpdates(false);
    }, 5000);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Setup manual check button (in settings page)
    const checkBtn = document.getElementById('checkUpdateBtn');
    if (checkBtn) {
        checkBtn.addEventListener('click', () => checkForUpdates(true));
    }

    // Auto-check on load
    initVersionCheck();
});

// Export for use in other scripts
window.S2RVersionCheck = {
    check: checkForUpdates,
    currentVersion: VERSION_CONFIG.currentVersion,
    compareVersions
};
