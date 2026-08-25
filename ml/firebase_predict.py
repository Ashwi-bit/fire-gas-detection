from firebase.firebase_config import sensor_ref
from ml.predict import predict


def predict_from_firebase():

    # Read current sensor data from Firebase
    data = sensor_ref.get()

    if not data:
        print("No sensor data found in Firebase.")
        return

    # Get sensor values
    temperature = float(data["temp"])
    gas = float(data["gas"])
    flame = int(data["flame"])

    # Prepare data for ML model
    sensor_data = {
        "temperature": temperature,
        "gas": gas,
        "flame": flame
    }

    # Get ML prediction
    result = predict(sensor_data)

    print("--------------------------------")
    print("Firebase Sensor Data")
    print("--------------------------------")
    print("Temperature:", temperature)
    print("Gas:", gas)
    print("Flame:", flame)

    print("--------------------------------")
    print("ML Prediction:", result)
    print("--------------------------------")


if __name__ == "__main__":
    predict_from_firebase()