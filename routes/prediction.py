from flask import Blueprint, jsonify
from datetime import datetime

from firebase.firebase_config import sensor_ref, database
from ml.predict import predict


prediction_bp = Blueprint("prediction", __name__)


@prediction_bp.route("/api/predict", methods=["GET"])
def get_prediction():

    try:
        # ---------------------------------------
        # 1. READ LATEST SENSOR DATA FROM FIREBASE
        # ---------------------------------------

        data = sensor_ref.get()

        if not data:
            return jsonify({
                "error": "No sensor data found in Firebase"
            }), 404

        # ---------------------------------------
        # 2. GET SENSOR VALUES
        # ---------------------------------------

        temperature = float(data.get("temp", 0))
        gas = float(data.get("gas", 0))
        flame = int(data.get("flame", 0))

        # ---------------------------------------
        # 3. SEND DATA TO ML MODEL
        # ---------------------------------------

        result = predict({
            "temperature": temperature,
            "gas": gas,
            "flame": flame
        })

        prediction = str(result)

        # ---------------------------------------
        # 4. DETERMINE RISK LEVEL
        # ---------------------------------------

        prediction_lower = prediction.lower()

        if "fire" in prediction_lower or "gas" in prediction_lower:
            risk_level = "HIGH"

        elif "warning" in prediction_lower or "risk" in prediction_lower:
            risk_level = "MEDIUM"

        else:
            risk_level = "LOW"

        # ---------------------------------------
        # 5. CREATE RESULT DATA
        # ---------------------------------------

        timestamp = datetime.now().isoformat()

        prediction_data = {
            "temperature": temperature,
            "gas": gas,
            "flame": flame,
            "prediction": prediction,
            "risk_level": risk_level,
            "timestamp": timestamp
        }

        # ---------------------------------------
        # 6. STORE PREDICTION IN FIREBASE
        # ---------------------------------------

        database.child("prediction").set(prediction_data)

        # ---------------------------------------
        # 7. GENERATE ALERT
        # ---------------------------------------

        if risk_level == "HIGH":

            alert_data = {
                "message": f"{prediction} detected!",
                "prediction": prediction,
                "risk_level": risk_level,
                "temperature": temperature,
                "gas": gas,
                "flame": flame,
                "status": "UNREAD",
                "timestamp": timestamp
            }

            database.child("alerts").child("current").set(alert_data)

        elif risk_level == "MEDIUM":

            alert_data = {
                "message": f"Warning: {prediction}",
                "prediction": prediction,
                "risk_level": risk_level,
                "temperature": temperature,
                "gas": gas,
                "flame": flame,
                "status": "UNREAD",
                "timestamp": timestamp
            }

            database.child("alerts").child("current").set(alert_data)

        else:

            database.child("alerts").child("current").set({
                "message": "No immediate danger",
                "prediction": prediction,
                "risk_level": risk_level,
                "temperature": temperature,
                "gas": gas,
                "flame": flame,
                "status": "CLEAR",
                "timestamp": timestamp
            })

        # ---------------------------------------
        # 8. RETURN RESULT TO USER
        # ---------------------------------------

        return jsonify(prediction_data), 200

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500