# backend/routes/prediction.py
from flask import Blueprint, jsonify
import firebase_admin
from firebase_admin import db

prediction_bp = Blueprint('prediction', __name__)

@prediction_bp.route('/api/predict', methods=['GET'])
def get_prediction():
    """Returns the latest prediction from Firebase"""
    try:
        # Read latest prediction (written by auto_prediction service)
        prediction_ref = db.reference('/sensor/prediction')
        prediction = prediction_ref.get()
        
        if not prediction:
            return jsonify({
                'error': 'No prediction available yet',
                'prediction': 'Waiting...',
                'risk_level': 'UNKNOWN'
            }), 200
        
        return jsonify(prediction), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500