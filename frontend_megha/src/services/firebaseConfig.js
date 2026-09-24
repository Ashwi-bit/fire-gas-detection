// src/services/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth'; // Changed import
import { getDatabase } from 'firebase/database';
// import AsyncStorage from '@react-native-async-storage/async-storage'; // No longer needed

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBp7FCg4nI-rPMmhmXDj46VUeT6MGle2kw",
  authDomain: "fire-gas-detection-7189b.firebaseapp.com",
  databaseURL: "https://fire-gas-detection-7189b-default-rtdb.firebaseio.com",
  projectId: "fire-gas-detection-7189b",
  storageBucket: "fire-gas-detection-7189b.firebasestorage.app",
  messagingSenderId: "536066865606",
  appId: "1:536066865606:android:97c1b17fba4dc9b4829ac7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth with persistence for WEB (browser)
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});

// Realtime Database
export const rtdb = getDatabase(app);