// src/services/firebaseConfig.js
// Copy this config from Firebase Console > Project Settings > General > Your apps > Web app
// (This is the SAME Firebase project your ESP32 is already writing to.)

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCwY4lj6Ej8bj0iLvm1nNU6cFzE06jxqJ4',
  authDomain: 'fire-gas-detection-7189b.firebaseapp.com',
  databaseURL: "https://fire-gas-detection-7189b-default-rtdb.firebaseio.com",  
  projectId: "fire-gas-detection-7189b",
    storageBucket: "fire-gas-detection-7189b.firebasestorage.app",
  messagingSenderId: "536066865606",
  appId: "1:536066865606:web:53ec1a1565409508829ac7",
};

const app = initializeApp(firebaseConfig);

// Auth with persistence so users stay logged in between app opens
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Realtime Database — this is where your live sensor values already land
export const rtdb = getDatabase(app);

// Firestore — used for emergency contacts, alert history, and monthly analysis data
export const firestore = getFirestore(app);

export default app;