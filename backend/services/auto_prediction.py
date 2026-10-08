# backend/services/auto_prediction.py
import time
import firebase_admin
from firebase_admin import credentials, db, messaging


# ==========================================================
# 🔧 THRESHOLDS – ADJUST THESE
# ==========================================================
GAS_THRESHOLD = 2000      # Gas above this → Gas Leakage
TEMP_THRESHOLD = 50       # Temperature above this (°C) → High Temp
STALE_SECONDS = 15        # Data older than this (sec) → treated as STALE
# ==========================================================


def init_firebase():
    """Initialize Firebase Admin SDK (once)"""
    if not firebase_admin._apps:
        cred = credentials.Certificate("firebase/serviceAccountKey.json")
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://fire-gas-detection-7189b-default-rtdb.firebaseio.com'
        })


def predict_risk(temp, gas, flame, humidity=45):
    """
    Simple threshold-based prediction:
    - Gas HIGH → Gas Leakage (RED)
    - Flame detected → Fire Detected (RED)
    - Both → Fire & Gas Leakage (CRITICAL)
    - Otherwise → Safe (GREEN)
    """
    if flame == 1 and gas > GAS_THRESHOLD:
        return "Fire & Gas Leakage", "CRITICAL"
    elif flame == 1:
        return "Fire Detected", "HIGH"
    elif gas > GAS_THRESHOLD:
        return "Gas Leakage", "HIGH"
    elif temp > TEMP_THRESHOLD:
        return "High Temperature", "MEDIUM"
    else:
        return "Safe", "LOW"


def send_fcm_notification(prediction, risk_level, temp, gas, flame):
    """
    Send FCM notification to all registered devices via Firebase Admin SDK.
    Only sends for HIGH or CRITICAL risk levels.
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

        success_count = 0

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
                        'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
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
                success_count += 1
                print(f"✅ Notification sent to {device_id}: {response}")

            except messaging.UnregisteredError:
                print(f"⚠️ Token for {device_id} is unregistered. Removing...")
                db.reference(f'/devices/{device_id}').delete()
            except Exception as e:
                print(f"❌ Failed to send to {device_id}: {e}")

        if success_count > 0:
            print(f"📤 Sent {success_count} notification(s)")

    except Exception as e:
        print(f"❌ FCM error: {e}")


def run_automatic_prediction():
    """Main auto-prediction loop (runs forever, every 5 seconds)"""
    init_firebase()

    print("=" * 60)
    print("🔥 AUTO PREDICTION SERVICE STARTED")
    print(f"   Gas Threshold:   {GAS_THRESHOLD} ppm")
    print(f"   Temp Threshold:  {TEMP_THRESHOLD} °C")
    print(f"   Stale After:     {STALE_SECONDS} seconds")
    print("=" * 60)

    last_risk_level = None  # Prevents notification spam

    while True:
        try:
            # Read latest sensor data
            sensor_data = db.reference('/sensor/latest').get()

            # ---------- NO DATA ----------
            if not sensor_data:
                db.reference('/sensor/prediction').set({
                    'prediction': 'No Data',
                    'risk_level': 'UNKNOWN',
                    'temperature': 0,
                    'humidity': 0,
                    'gas': 0,
                    'flame': 0,
                    'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
                })
                print("⏳ No sensor data available")
                time.sleep(5)
                continue

            # ---------- PARSE VALUES ----------
            temp = float(sensor_data.get('temp', 0))
            humidity = float(sensor_data.get('humidity', 45))
            gas = float(sensor_data.get('gas', 0))
            flame = int(sensor_data.get('flame', 0))

            # ---------- PREDICT ----------
            prediction, risk_level = predict_risk(temp, gas, flame, humidity)

            # ---------- WRITE PREDICTION ----------
            db.reference('/sensor/prediction').set({
                'prediction': prediction,
                'risk_level': risk_level,
                'temperature': temp,
                'humidity': humidity,
                'gas': gas,
                'flame': flame,
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
            })

            # ---------- LOG ----------
            if risk_level == "LOW":
                emoji = "🟢"
            elif risk_level == "MEDIUM":
                emoji = "🟡"
            else:
                emoji = "🔴"

            print(f"{emoji} {prediction} ({risk_level}) | 🌡 {temp}°C | 💨 {gas}ppm | 🔥 {flame}")

            # ---------- SEND FCM (ONLY WHEN RISK CHANGES) ----------
            if risk_level in ['HIGH', 'CRITICAL'] and risk_level != last_risk_level:
                print(f"📤 Sending notification for {risk_level} risk...")
                send_fcm_notification(prediction, risk_level, temp, gas, flame)

            last_risk_level = risk_level

        except Exception as e:
            print(f"❌ Error in prediction loop: {e}")

        time.sleep(5)