from datetime import date
from flask import Blueprint, request, jsonify, g
from ..mongo_client import get_db, serialize_docs, serialize_doc
from ..auth import require_auth

food_bp = Blueprint("food", __name__)


@food_bp.route("/logs", methods=["GET"])
@require_auth
def get_logs():
    db = get_db()
    date_filter = request.args.get("date")
    from_date = request.args.get("from")
    to_date = request.args.get("to")

    query = {"user_id": g.user_id}
    if date_filter:
        query["log_date"] = date_filter
    elif from_date and to_date:
        query["log_date"] = {"$gte": from_date, "$lte": to_date}

    docs = db.food_logs.find(query).sort("logged_at", -1)
    return jsonify(serialize_docs(docs))


@food_bp.route("/logs/<log_id>", methods=["DELETE"])
@require_auth
def delete_log(log_id):
    db = get_db()
    db.food_logs.delete_one({"id": log_id, "user_id": g.user_id})
    return jsonify({"success": True})
