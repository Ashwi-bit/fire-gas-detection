import pandas as pd
import joblib

from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report


# ---------------------------------------
# PROJECT PATH
# ---------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_PATH = BASE_DIR / "dataset" / "train.csv"
MODEL_DIR = BASE_DIR / "models"

MODEL_DIR.mkdir(exist_ok=True)


# ---------------------------------------
# LOAD DATASET
# ---------------------------------------

df = pd.read_csv(DATASET_PATH)

print("Dataset loaded successfully!")
print("Dataset shape:", df.shape)

print("\nFirst 5 rows:")
print(df.head())


# ---------------------------------------
# FEATURES AND TARGET
# ---------------------------------------

X = df[
    [
        "temperature",
        "flame",
        "gas"
    ]
]

y = df["label"]


# ---------------------------------------
# ENCODE LABELS
# ---------------------------------------

label_encoder = LabelEncoder()

y_encoded = label_encoder.fit_transform(y)

print("\nClasses:")
print(label_encoder.classes_)


# ---------------------------------------
# SCALE FEATURES
# ---------------------------------------

scaler = StandardScaler()

X_scaled = scaler.fit_transform(X)


# ---------------------------------------
# TRAIN RANDOM FOREST
# ---------------------------------------

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X_scaled, y_encoded)


# ---------------------------------------
# TRAINING ACCURACY
# ---------------------------------------

predictions = model.predict(X_scaled)

accuracy = accuracy_score(y_encoded, predictions)

print("\nTraining Accuracy:", accuracy)


# ---------------------------------------
# SAVE MODEL
# ---------------------------------------

joblib.dump(
    model,
    MODEL_DIR / "random_forest.pkl"
)

joblib.dump(
    scaler,
    MODEL_DIR / "scaler.pkl"
)

joblib.dump(
    label_encoder,
    MODEL_DIR / "label_encoder.pkl"
)


print("\n--------------------------------")
print("MODEL TRAINING COMPLETED!")
print("--------------------------------")

print("\nFiles created:")

print(MODEL_DIR / "random_forest.pkl")
print(MODEL_DIR / "scaler.pkl")
print(MODEL_DIR / "label_encoder.pkl")