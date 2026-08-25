import joblib
import pandas as pd

from pathlib import Path


# ---------------------------------------
# PROJECT PATH
# ---------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "random_forest.pkl"
SCALER_PATH = BASE_DIR / "models" / "scaler.pkl"
ENCODER_PATH = BASE_DIR / "models" / "label_encoder.pkl"


# ---------------------------------------
# LOAD MODEL FILES
# ---------------------------------------

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
label_encoder = joblib.load(ENCODER_PATH)


# ---------------------------------------
# PREDICTION FUNCTION
# ---------------------------------------

def predict(data):

    df = pd.DataFrame([{
        "temperature": data["temperature"],
        "flame": data["flame"],
        "gas": data["gas"]
    }])

    # Scale sensor values
    scaled_data = scaler.transform(df)

    # Predict
    prediction = model.predict(scaled_data)

    # Convert number back to label
    result = label_encoder.inverse_transform(prediction)

    return result[0]