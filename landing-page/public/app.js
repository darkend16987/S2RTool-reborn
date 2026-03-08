/**
 * S2R Tool Landing Page - App Logic
 *
 * Post-authentication functionality:
 * - Copy code blocks
 * - Tab switching
 * - Dynamic version info from GitHub API
 */

/**
 * Initialize app after successful authentication
 */
function initApp(user) {
    console.log('Landing page initialized for:', user.email);
    fetchLatestVersion();
}

/**
 * Fetch latest version from GitHub Releases API
 */
async function fetchLatestVersion() {
    try {
        const response = await fetch(
            'https://api.github.com/repos/darkend16987/S2RTool-reborn/releases/latest'
        );

        if (!response.ok) return;

        const release = await response.json();
        const version = release.tag_name.startsWith('v')
            ? release.tag_name
            : `v${release.tag_name}`;

        // Update version display
        const versionEl = document.getElementById('current-version');
        if (versionEl) versionEl.textContent = version;

        // Update release date
        const dateEl = document.getElementById('release-date');
        if (dateEl && release.published_at) {
            const date = new Date(release.published_at);
            dateEl.textContent = `Released: ${date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`;
        }

        // Update download link
        const downloadLink = document.getElementById('download-release-link');
        if (downloadLink && release.html_url) {
            downloadLink.href = release.html_url;
        }

        // Update changelog if release body exists
        if (release.body) {
            updateChangelog(release);
        }
    } catch (error) {
        console.warn('Could not fetch latest version:', error);
    }
}

/**
 * Update changelog section with latest release info
 */
function updateChangelog(release) {
    const changelogList = document.getElementById('changelog-list');
    if (!changelogList) return;

    const version = release.tag_name.startsWith('v')
        ? release.tag_name
        : `v${release.tag_name}`;

    const date = release.published_at
        ? new Date(release.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : '';

    // Parse release body into list items
    const bodyLines = release.body
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .filter(line => line.length > 0);

    const listItems = bodyLines.map(line => `<li>${escapeHtml(line)}</li>`).join('');

    changelogList.innerHTML = `
        <div class="changelog-item">
            <div class="changelog-version">
                <span class="version-badge">${escapeHtml(version)}</span>
                <span class="changelog-date">${escapeHtml(date)}</span>
            </div>
            <h3>${escapeHtml(release.name || version)}</h3>
            <ul>${listItems}</ul>
        </div>
    `;
}

/**
 * Copy code block content to clipboard
 */
function copyCode(btn) {
    const codeBlock = btn.closest('.code-block');
    const code = codeBlock.querySelector('code');

    if (!code) return;

    navigator.clipboard.writeText(code.textContent).then(() => {
        const icon = btn.querySelector('.material-symbols-rounded');
        const originalText = icon.textContent;
        icon.textContent = 'check';
        btn.style.color = '#10b981';

        setTimeout(() => {
            icon.textContent = originalText;
            btn.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

/**
 * Copy text to clipboard (for inline copy buttons)
 */
function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Brief visual feedback could be added here
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

/**
 * Switch tabs in installation steps
 */
function switchTab(btn, tabId) {
    // Deactivate all tabs in the same group
    const group = btn.closest('.step-content');
    group.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    group.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    // Activate selected
    btn.classList.add('active');
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Smooth scroll for anchor links
 */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                const topBarHeight = 60;
                const top = target.getBoundingClientRect().top + window.scrollY - topBarHeight;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
});
