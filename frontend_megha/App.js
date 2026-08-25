// App.js
import 'react-native-gesture-handler';
import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
  import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from './src/services/notifications';

// Inside your App component or Home screen component:
useEffect(() => {
  const registerDevice = async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      try {
        await fetch('http://YOUR_BACKEND_IP:5000/api/register-device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        console.log('Device registered for notifications:', token);
      } catch (err) {
        console.error('Failed to register device:', err);
      }
    }
  };

  registerDevice();
}, []);
}