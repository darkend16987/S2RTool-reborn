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
    // TODO: Replace with your Firebase project configuration
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
