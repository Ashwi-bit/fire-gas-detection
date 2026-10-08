# backend/routes/prediction.py
from flask import Blueprint, jsonify, request
import firebase_admin
from firebase_admin import db
from datetime import datetime, timedelta

prediction_bp = Blueprint('prediction', __name__)


@prediction_bp.route('/api/predict', methods=['GET'])
def get_prediction():
    """Returns the latest prediction"""
    try:
        prediction = db.reference('/sensor/prediction').get()
        if not prediction:
            return jsonify({
                'prediction': 'Waiting...',
                'risk_level': 'UNKNOWN'
            }), 200
        return jsonify(prediction), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@prediction_bp.route('/api/history', methods=['GET'])
def get_history():
    """
    Returns historical sensor readings
    Query params:
      - days: number of days to look back (default: 7)
      - limit: max readings to return (default: 200)
    """
    try:
        days = int(request.args.get('days', 7))
        limit = int(request.args.get('limit', 200))
        
        # Read all readings from Firebase
        readings = db.reference('/sensor/readings').get()
        
        if not readings:
            return jsonify({
                'count': 0,
                'data': [],
                'stats': None
            }), 200
        
        # Flatten nested structure
        all_readings = []
        for date, times in readings.items():
            for time_str, values in times.items():
                try:
                    dt = datetime.strptime(f"{date} {time_str}", "%Y-%m-%d %H:%M:%S")
                    all_readings.append({
                        'timestamp': f"{date} {time_str}",
                        'datetime': dt.isoformat(),
                        'temp': float(values.get('temp', 0)),
                        'humidity': float(values.get('humidity', 0)),
                        'gas': float(values.get('gas', 0)),
                        'flame': int(values.get('flame', 0)),
                    })
                except Exception:
                    continue
        
        # Sort newest first
        all_readings.sort(key=lambda x: x['datetime'], reverse=True)
        
        # Filter by days
        cutoff = datetime.now() - timedelta(days=days)
        filtered = [r for r in all_readings if datetime.fromisoformat(r['datetime']) >= cutoff]
        
        # Apply limit
        limited = filtered[:limit]
        
        # Calculate stats
        stats = calculate_stats(filtered)
        
        return jsonify({
            'count': len(limited),
            'total_available': len(filtered),
            'data': limited,
            'stats': stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@prediction_bp.route('/api/stats', methods=['GET'])
def get_stats():
    """Returns aggregated statistics"""
    try:
        days = int(request.args.get('days', 7))
        
        readings = db.reference('/sensor/readings').get()
        
        if not readings:
            return jsonify({'error': 'No data available'}), 404
        
        # Flatten
        all_readings = []
        for date, times in readings.items():
            for time_str, values in times.items():
                try:
                    dt = datetime.strptime(f"{date} {time_str}", "%Y-%m-%d %H:%M:%S")
                    all_readings.append({
                        'datetime': dt,
                        'temp': float(values.get('temp', 0)),
                        'humidity': float(values.get('humidity', 0)),
                        'gas': float(values.get('gas', 0)),
                        'flame': int(values.get('flame', 0)),
                    })
                except Exception:
                    continue
        
        if days >= 365:
            cutoff = datetime(1970, 1, 1)  # Include all data
        else:
            cutoff = datetime.now() - timedelta(days=days)
        filtered = [r for r in all_readings if r['datetime'] >= cutoff]
        
        return jsonify(calculate_stats(filtered)), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def calculate_stats(readings):
    """Calculate statistics from readings list"""
    if not readings:
        return {
            'total_readings': 0,
            'avg_temp': 0,
            'max_temp': 0,
            'min_temp': 0,
            'avg_gas': 0,
            'max_gas': 0,
            'min_gas': 0,
            'avg_humidity': 0,
            'flame_events': 0,
            'gas_leak_events': 0,
        }
    
    temps = [r['temp'] for r in readings]
    gases = [r['gas'] for r in readings]
    humidities = [r['humidity'] for r in readings]
    flames = [r['flame'] for r in readings]
    
    return {
        'total_readings': len(readings),
        'avg_temp': round(sum(temps) / len(temps), 2),
        'max_temp': round(max(temps), 2),
        'min_temp': round(min(temps), 2),
        'avg_gas': round(sum(gases) / len(gases), 0),
        'max_gas': round(max(gases), 0),
        'min_gas': round(min(gases), 0),
        'avg_humidity': round(sum(humidities) / len(humidities), 2),
        'flame_events': sum(flames),
        'gas_leak_events': sum(1 for g in gases if g > 2000),
    }