# backend/services/fcm_service.py
"""
Firebase Cloud Messaging service
Sends push notifications directly via Firebase Admin SDK
"""
import firebase_admin
from firebase_admin import messaging, db


def send_fcm_notification(prediction, risk_level, temp, gas, flame):
    """
    Send FCM notification to all registered devices
    Only sends for HIGH or CRITICAL risk levels
    """
    if risk_level not in ['HIGH', 'CRITICAL']:
        return

    try:
        # Get all device tokens from Firebase
        devices = db.reference('/devices').get()

        if not devices:
            print("⚠️ No devices registered for notifications")
            return

        # Build message content
        emoji = "🚨" if risk_level == "CRITICAL" else "⚠️"
        title = f"{emoji} {risk_level} RISK DETECTED"
        body = f"{prediction}\n🌡 {temp}°C | 💨 {gas}ppm | 🔥 {flame}"

        # Send to each registered device
        for device_id, device in devices.items():
            token = device.get('token')
            if not token:
                continue

            try:
                # Build FCM message
                message = messaging.Message(
                    notification=messaging.Notification(
                        title=title,
                        body=body,
                    ),
                    data={
                        'prediction': str(prediction),
                        'risk_level': str(risk_level),
                        'temperature': str(temp),
                        'gas': str(gas),
                        'flame': str(flame),
                        'timestamp': str(__import__('time').strftime("%Y-%m-%d %H:%M:%S")),
                    },
                    android=messaging.AndroidConfig(
                        priority='high',
                        notification=messaging.AndroidNotification(
                            channel_id='alerts',
                            sound='default',
                            color='#FF231F7C',
                            priority='max',
                        ),
                    ),
                    token=token,
                )

                # Send notification
                response = messaging.send(message)
                print(f"✅ Notification sent to {device_id}: {response}")

            except Exception as e:
                print(f"❌ Failed to send to {device_id}: {e}")

    except Exception as e:
        print(f"❌ FCM error: {e}")