from flask import Blueprint

health_bp = Blueprint("health", __name__)

@health_bp.route("/")
def home():
    return {"message": "Backend Running Successfully"}