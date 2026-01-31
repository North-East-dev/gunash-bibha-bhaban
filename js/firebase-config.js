
// js/firebase-config.js
// Replace with your Firebase Project Configuration
// 1. Go to Firebase Console -> Project Settings -> General
// 2. Scroll down to "Your apps" -> Select "Web"
// 3. Copy the firebaseConfig object and paste it below

const firebaseConfig = {
  apiKey: "AIzaSyDJvHiVf_qcw8O2WDDsFpWjC8NJLrgTqto",
  authDomain: "gpbb-7838c.firebaseapp.com",
  databaseURL: "https://gpbb-7838c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gpbb-7838c",
  storageBucket: "gpbb-7838c.firebasestorage.app",
  messagingSenderId: "578970150197",
  appId: "1:578970150197:web:8eee2fb8877c241c14987c",
  measurementId: "G-6HK5WZQ0PH"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
} else {
  console.warn('Firebase SDK not loaded.');
}
