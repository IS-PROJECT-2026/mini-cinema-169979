import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA_R7bW-pOY1j0rOAawgvqAQDzWPbHWaNQ",
    authDomain: "mini-cinema-6ce1f.firebaseapp.com",
    databaseURL: "https://mini-cinema-6ce1f-default-rtdb.firebaseio.com",
    projectId: "mini-cinema-6ce1f",
    storageBucket: "mini-cinema-6ce1f.firebasestorage.app",
    messagingSenderId: "134082862012",
    appId: "1:134082862012:web:8c4a72febebe3306bfe9b9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getDatabase(app);


export { auth, db };