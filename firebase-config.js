// Firebase configuration for Phone Authentication
// Configuration from otp3.html - OTP Verification Project
const firebaseConfig = {
    apiKey: "AIzaSyBVZpCf7CNl5dPzDVKI8RqSZzVIYEW3jVo",
    authDomain: "scrapkart-502be.firebaseapp.com",
    projectId: "scrapkart-502be",
    storageBucket: "scrapkart-502be.firebasestorage.app",
    messagingSenderId: "664108414442",
    appId: "1:664108414442:web:c7dc197e1bce5883f2ae93",
    measurementId: "G-NB9ZFPFL4K"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = firebase.auth();

// Enable phone authentication
auth.useDeviceLanguage();

// Configure phone authentication settings
auth.settings.appVerificationDisabledForTesting = false; // Set to true only for testing

console.log('Firebase initialized successfully for OTP verification');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Auth Domain:', firebaseConfig.authDomain);
