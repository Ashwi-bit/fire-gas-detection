# test_firebase.py
import sys
import traceback

try:
    print("Step 1: Importing firebase_admin...")
    import firebase_admin
    from firebase_admin import credentials, db
    print("OK - Import successful")

    print("Step 2: Loading key...")
    cred = credentials.Certificate("firebase/serviceAccountKey.json")
    print("OK - Key loaded")

    print("Step 3: Initializing Firebase...")
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://fire-gas-detection-7189b-default-rtdb.firebaseio.com'
    })
    print("OK - Firebase initialized")

    print("Step 4: Reading /sensor/latest...")
    ref = db.reference('/sensor/latest')
    data = ref.get()
    print("OK - Data fetched!")
    print("Data:", data)

except Exception as e:
    print(f"\nERROR: {e}")
    traceback.print_exc()
    sys.exit(1)