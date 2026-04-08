// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCr17kJrX1oHB6TGy1PgaErP-pajr8s3cc",
  authDomain: "resume-analyzer-f2c65.firebaseapp.com",
  projectId: "resume-analyzer-f2c65",
  storageBucket: "resume-analyzer-f2c65.firebasestorage.app",
  messagingSenderId: "1085291797389",
  appId: "1:1085291797389:web:562101b96cf7e81972bbc4",
  measurementId: "G-Z7EDNX7ZR1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
