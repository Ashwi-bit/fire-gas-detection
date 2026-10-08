// src/services/pushNotifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ref, set } from 'firebase/database';
import { rtdb } from './firebaseConfig';

// ─────────────────────────────────────────────────────────
// 1. How notifications appear when app is OPEN
// ─────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─────────────────────────────────────────────────────────
// 2. Register device and get FCM token
// ─────────────────────────────────────────────────────────
export async function registerForPushNotificationsAsync() {
  let token;

  // Create Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Fire & Gas Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
  }

  // Must be a physical device (not emulator)
  if (!Device.isDevice) {
    console.log('⚠️ Must use a physical device');
    return null;
  }

  // Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('❌ Notification permission denied');
    return null;
  }

  // Get FCM device token (works with Firebase Admin SDK)
  try {
    const deviceToken = (await Notifications.getDevicePushTokenAsync()).data;
    console.log('✅ FCM Token:', deviceToken);

    // Save token to Firebase
    await set(ref(rtdb, '/devices/phone1'), {
      token: deviceToken,
      platform: Platform.OS,
      deviceName: Device.deviceName || 'Unknown',
      registeredAt: new Date().toISOString(),
    });

    console.log('✅ Token saved to Firebase');
    return deviceToken;
  } catch (error) {
    console.error('❌ FCM token error:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// 3. Set up notification listeners
// ─────────────────────────────────────────────────────────
export function setupNotificationListeners() {
  // Fires when notification received while app is open
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('🔔 Notification received:', notification);
    }
  );

  // Fires when user taps the notification
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapped:', response);
    });

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

// ─────────────────────────────────────────────────────────
// 4. Send a local test notification (optional)
// ─────────────────────────────────────────────────────────
export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Test Notification',
      body: 'Notifications are working!',
      sound: 'default',
    },
    trigger: { seconds: 1 },
  });
}