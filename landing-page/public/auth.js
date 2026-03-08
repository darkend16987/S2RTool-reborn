/**
 * S2R Tool Landing Page - Firebase Authentication
 *
 * Handles Google sign-in and Gmail whitelist verification.
 * Whitelist is stored in Firestore collection: "allowed_users"
 *
 * To add a user:
 *   - Go to Firestore > allowed_users
 *   - Add document with ID = email address
 *   - Fields: { email: "user@gmail.com", name: "User Name", addedAt: timestamp }
 *
 * Or use the Firebase Admin SDK / CLI to batch add users.
 */

const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// DOM Elements
const authGate = document.getElementById('auth-gate');
const authLoading = document.getElementById('auth-loading');
const mainContent = document.getElementById('main-content');
const authError = document.getElementById('auth-error');
const userEmailEl = document.getElementById('user-email');

/**
 * Check if a user's email is in the whitelist
 */
async function isEmailWhitelisted(email) {
    try {
        const doc = await db.collection('allowed_users').doc(email.toLowerCase()).get();
        return doc.exists;
    } catch (error) {
        console.error('Error checking whitelist:', error);
        return false;
    }
}

/**
 * Show the appropriate view based on auth state
 */
function showView(view) {
    authGate.style.display = view === 'auth' ? 'flex' : 'none';
    authLoading.style.display = view === 'loading' ? 'flex' : 'none';
    mainContent.style.display = view === 'main' ? 'block' : 'none';
}

/**
 * Handle Google Sign-In
 */
async function handleGoogleSignIn() {
    const signInBtn = document.getElementById('btn-google-signin');
    signInBtn.disabled = true;
    signInBtn.style.opacity = '0.6';
    authError.style.display = 'none';

    try {
        const result = await auth.signInWithPopup(googleProvider);
        // Auth state listener will handle the rest
    } catch (error) {
        console.error('Sign-in error:', error);
        signInBtn.disabled = false;
        signInBtn.style.opacity = '1';

        if (error.code === 'auth/popup-closed-by-user') {
            // User closed popup, no error to show
            return;
        }

        authError.textContent = getErrorMessage(error);
        authError.style.display = 'block';
    }
}

/**
 * Handle Sign Out
 */
async function handleSignOut() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Sign-out error:', error);
    }
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error) {
    switch (error.code) {
        case 'auth/popup-blocked':
            return 'Popup bị chặn. Vui lòng cho phép popup trong trình duyệt và thử lại.';
        case 'auth/network-request-failed':
            return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
        case 'auth/cancelled-popup-request':
            return 'Yêu cầu đăng nhập bị hủy. Vui lòng thử lại.';
        default:
            return `Lỗi đăng nhập: ${error.message}`;
    }
}

/**
 * Auth state listener - core flow control
 */
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        // Not logged in
        showView('auth');
        return;
    }

    // User is logged in, check whitelist
    showView('loading');

    const allowed = await isEmailWhitelisted(user.email);

    if (allowed) {
        // Authorized user
        userEmailEl.textContent = user.email;
        showView('main');

        // Initialize app content after auth
        if (typeof initApp === 'function') {
            initApp(user);
        }
    } else {
        // Not in whitelist
        await auth.signOut();
        showView('auth');
        authError.innerHTML = `
            <strong>Truy cập bị từ chối</strong><br>
            Email <strong>${user.email}</strong> chưa được cấp quyền truy cập.<br>
            Vui lòng liên hệ admin để được thêm vào danh sách.
        `;
        authError.style.display = 'block';
    }
});
