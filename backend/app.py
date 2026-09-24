from flask import Flask
from flask_cors import CORS
import threading
import os

from routes.prediction import prediction_bp
from routes.firebase_api import firebase_bp
from routes.health import health_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(prediction_bp)
app.register_blueprint(firebase_bp)
app.register_blueprint(health_bp)

# ---------------------------------------
# START AUTOMATIC ML PREDICTION
# ---------------------------------------
from backend.services.auto_prediction import run_automatic_prediction

prediction_thread = threading.Thread(
    target=run_automatic_prediction,
    daemon=True
)
prediction_thread.start()
print("✅ Auto prediction thread started")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)  # ← debug=False to avoid double thread