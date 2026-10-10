// src/services/firebaseConfig.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize Firebase (safe against double-init on fast refresh)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth with AsyncStorage persistence so users stay logged in on the phone
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Already initialized
  authInstance = getAuth(app);
}
export const auth = authInstance;

// Realtime Database (sensor data + FCM token)
export const rtdb = getDatabase(app);

// Firestore (emergency contacts + device location in SettingsScreen)
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });
} catch (e) {
  // Already initialized
  firestoreInstance = getFirestore(app);
}
export const firestore = firestoreInstance;
