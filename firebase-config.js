// Firebase configuration for Phone Authentication
// Configuration from otp3.html - OTP Verification Project

const firebaseConfig = {
    apiKey: "AIzaSyAFoWC_yjIOk-xnojrfWUApYF8vWMpHnV8",
    authDomain: "scrapkart-1a3cc.firebaseapp.com",
    projectId: "scrapkart-1a3cc",
    storageBucket: "scrapkart-1a3cc.firebasestorage.app",
    messagingSenderId: "298422430226",
    appId: "1:298422430226:web:18e1805b7607bf8799c6cb",
    measurementId: "G-XMG1J8LMGP",
    databaseURL: "https://scrapkart-1a3cc-default-rtdb.asia-southeast1.firebasedatabase.app"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Auth and Database
const auth = firebase.auth();
const db = firebase.database();

// Enable phone authentication
auth.useDeviceLanguage();

// Configure phone authentication settings
auth.settings.appVerificationDisabledForTesting = false; // Set to true only for testing

console.log('Firebase initialized successfully for OTP verification');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Auth Domain:', firebaseConfig.authDomain);
