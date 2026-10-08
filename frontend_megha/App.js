// App.js
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from './src/services/pushNotifications';

export default function App() {
  useEffect(() => {
    // Register for push notifications on app start
    registerForPushNotificationsAsync();

    // Set up listeners for incoming notifications
    const cleanup = setupNotificationListeners();

    return cleanup;
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}