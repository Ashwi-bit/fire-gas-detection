# backend/services/auto_prediction.py
import time
import requests
import firebase_admin
from firebase_admin import db, credentials


def init_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate("firebase/serviceAccountKey.json")
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://fire-gas-detection-7189b-default-rtdb.firebaseio.com'
        })


def predict_risk(temp, gas, flame, humidity=45):
    if flame == 1 and gas > 3000:
        return "Fire & Gas Leakage", "CRITICAL"
    elif flame == 1:
        return "Fire Detected", "HIGH"
    elif gas > 3000:
        return "Gas Leakage", "HIGH"
    elif gas > 2000:
        return "Gas Warning", "MEDIUM"
    elif temp > 45:
        return "High Temperature", "MEDIUM"
    else:
        return "Safe", "LOW"


def send_push_notification(prediction, risk_level, temp, gas, flame):
    """Send notification via Expo Push API"""
    if risk_level not in ['HIGH', 'CRITICAL']:
        return

    try:
        devices = db.reference('/devices').get()
        if not devices:
            print("⚠️ No devices registered")
            return

        emoji = "🚨" if risk_level == "CRITICAL" else "⚠️"
        title = f"{emoji} {risk_level} RISK DETECTED"
        body = f"{prediction}\n🌡 {temp}°C | 💨 {gas}ppm | 🔥 {flame}"

        for device_id, device in devices.items():
            token = device.get('token')
            if not token:
                continue

            message = {
                "to": token,
                "sound": "default",
                "title": title,
                "body": body,
                "priority": "high",
                "channelId": "alerts",
                "data": {
                    "prediction": prediction,
                    "risk_level": risk_level,
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
                }
            }

            response = requests.post(
                "https://exp.host/--/api/v2/push/send",
                json=message,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                print(f"✅ Notification sent to {device_id}")
            else:
                print(f"❌ Failed: {response.text}")

    except Exception as e:
        print(f"❌ Notification error: {e}")


def run_automatic_prediction():
    init_firebase()
    print("=" * 50)
    print("🔥 AUTO PREDICTION SERVICE STARTED")
    print("=" * 50)

    last_risk_level = None

    while True:
        try:
            ref = db.reference('/sensor/latest')
            sensor_data = ref.get()

            if not sensor_data:
                time.sleep(5)
                continue

            temp = float(sensor_data.get('temp', 0))
            humidity = float(sensor_data.get('humidity', 45))
            gas = float(sensor_data.get('gas', 0))
            flame = int(sensor_data.get('flame', 0))

            prediction, risk_level = predict_risk(temp, gas, flame, humidity)

            db.reference('/sensor/prediction').set({
                'prediction': prediction,
                'risk_level': risk_level,
                'temperature': temp,
                'humidity': humidity,
                'gas': gas,
                'flame': flame,
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
            })

            print(f"🌡 {temp}°C | 💨 {gas} | 🔥 {flame} | ✅ {prediction} ({risk_level})")

            # Send notification ONLY when risk CHANGES
            if risk_level in ['HIGH', 'CRITICAL'] and risk_level != last_risk_level:
                send_push_notification(prediction, risk_level, temp, gas, flame)

            last_risk_level = risk_level

        except Exception as e:
            print(f"❌ Error: {e}")

        time.sleep(5)