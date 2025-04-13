import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
    apiKey: "AIzaSyCzAJkNxlU4bLJ_k4zKLAsU44jRkN_yAWU",
    authDomain: "todolist-6cbc0.firebaseapp.com",
    projectId: "todolist-6cbc0",
    storageBucket: "todolist-6cbc0.firebasestorage.app",
    messagingSenderId: "251320003189",
    appId: "1:251320003189:web:807480cf3fe45b4acc663c",
    measurementId: "G-WVXVYB5D9X"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

