import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBRdukrD1dM5AJmbAh7JPT2yWsHdgzbvzw",
  authDomain: "ssss-19e02.firebaseapp.com",
  projectId: "ssss-19e02",
  storageBucket: "ssss-19e02.firebasestorage.app",
  messagingSenderId: "17505490718",
  appId: "1:17505490718:web:505a11b64236129907db0f",
  measurementId: "G-P4EY62HW01"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage, firebaseConfig };
