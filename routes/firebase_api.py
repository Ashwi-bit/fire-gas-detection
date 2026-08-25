from flask import Blueprint, request, jsonify
from firebase.firebase_config import database

firebase_bp = Blueprint("firebase", __name__)


@firebase_bp.route("/save", methods=["POST"])
def save():

    data = request.json

    database.push(data)

    return {
        "status": "Success"
    }


# ---------------------------------------
# GET CURRENT ALERT
# ---------------------------------------

@firebase_bp.route("/api/alert", methods=["GET"])
def get_alert():

    try:
        alert = database.child("alerts").child("current").get()

        if not alert:
            return jsonify({
                "message": "No alert found"
            }), 404

        return jsonify(alert), 200

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500