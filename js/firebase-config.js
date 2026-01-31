
// js/firebase-config.js
// Replace with your Firebase Project Configuration
// 1. Go to Firebase Console -> Project Settings -> General
// 2. Scroll down to "Your apps" -> Select "Web"
// 3. Copy the firebaseConfig object and paste it below

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
} else {
  console.warn('Firebase SDK not loaded.');
}
