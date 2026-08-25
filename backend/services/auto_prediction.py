import time
from datetime import datetime

from firebase.firebase_config import sensor_ref
from ml.predict import predict

CHECK_INTERVAL = 5   # Check Firebase every 5 seconds

print("========================================")
print("🔥 AUTO PREDICTION SERVICE STARTED")
print("========================================")

last_data = None

while True:
    try:
        # Read sensor values from Firebase
        data = sensor_ref.get()

        if data:
            temperature = float(data.get("temp", 0))
            gas = float(data.get("gas", 0))
            flame = int(data.get("flame", 0))

            current_data = (temperature, gas, flame)

            # Predict only if sensor values changed
            if current_data != last_data:

                result = predict({
                    "temperature": temperature,
                    "gas": gas,
                    "flame": flame
                })

                # Save prediction back to Firebase
                sensor_ref.update({
                    "prediction": result,
                    "lastPredictionTime": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })

                print(f"🌡 Temp: {temperature}")
                print(f"🛢 Gas: {gas}")
                print(f"🔥 Flame: {flame}")
                print(f"✅ Prediction: {result}")
                print("----------------------------------")

                last_data = current_data

        time.sleep(CHECK_INTERVAL)

    except Exception as e:
        print("❌ Error:", e)
        time.sleep(CHECK_INTERVAL)