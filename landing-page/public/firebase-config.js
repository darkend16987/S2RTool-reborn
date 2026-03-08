/**
 * Firebase Configuration for S2R Tool Landing Page
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (or use existing)
 * 3. Enable Authentication > Google sign-in
 * 4. Enable Firestore Database
 * 5. Add your web app and copy the config below
 * 6. Replace the placeholder values with your actual Firebase config
 */

const firebaseConfig = {
    apiKey: "AIzaSyAGyNj7mTriivueAQWs-OM2Ug35mqAWjBc",
    authDomain: "s2rtool-e38ff.firebaseapp.com",
    projectId: "s2rtool-e38ff",
    storageBucket: "s2rtool-e38ff.firebasestorage.app",
    messagingSenderId: "609593402839",
    appId: "1:609593402839:web:752114cc630e0dd03d9792",
    measurementId: "G-7N8TTFW7J0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
