import firebase_admin
from firebase_admin import credentials, db
from pathlib import Path


# Project root
BASE_DIR = Path(__file__).resolve().parent.parent

# Service account file
SERVICE_ACCOUNT = BASE_DIR / "firebase" / "serviceAccountKey.json"

# Firebase Realtime Database URL
DATABASE_URL = "https://fire-gas-detection-7189b-default-rtdb.firebaseio.com"


# Initialize Firebase
cred = credentials.Certificate(SERVICE_ACCOUNT)

firebase_admin.initialize_app(
    cred,
    {
        "databaseURL": DATABASE_URL
    }
)


# Firebase database reference
database = db.reference()
sensor_ref = db.reference("sensor")