"""
MongoDB client for NutriTrack AI.
Uses MongoDB Atlas (free M0 cluster) for all data storage.
Supabase is kept ONLY for authentication (Google OAuth).
"""
import os
from datetime import datetime, timezone
from uuid import uuid4
from pymongo import MongoClient, DESCENDING, ASCENDING
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

MONGO_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.environ.get("MONGODB_DB_NAME", "nutritrack")

_client: MongoClient | None = None
_db = None


def get_db():
    """Get the MongoDB database instance (lazy singleton)."""
    global _client, _db
    if _db is None:
        _client = MongoClient(MONGO_URI)
        _db = _client[MONGO_DB_NAME]
        _ensure_indexes(_db)
    return _db


def _ensure_indexes(db):
    """Create indexes for performance."""
    # food_logs
    db.food_logs.create_index([("user_id", ASCENDING), ("log_date", DESCENDING)])
    db.food_logs.create_index([("user_id", ASCENDING), ("logged_at", DESCENDING)])

    # activities
    db.activities.create_index([("user_id", ASCENDING), ("activity_date", DESCENDING)])
    db.activities.create_index([("user_id", ASCENDING), ("source", ASCENDING), ("source_id", ASCENDING)])

    # user_goals
    db.user_goals.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])

    # meal_plans
    db.meal_plans.create_index([("user_id", ASCENDING), ("generated_at", DESCENDING)])

    # connected_apps
    db.connected_apps.create_index([("user_id", ASCENDING), ("provider", ASCENDING)], unique=True)

    # user_profiles
    db.user_profiles.create_index("user_id", unique=True)

    # posts (social groundwork)
    db.posts.create_index([("created_at", DESCENDING)])
    db.posts.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])


def new_id() -> str:
    """Generate a new UUID string for document IDs."""
    return str(uuid4())


def now_iso() -> str:
    """Current UTC timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat()


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-safe dict (convert ObjectId to string)."""
    if doc is None:
        return {}
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def serialize_docs(docs) -> list[dict]:
    """Convert a cursor/list of MongoDB documents to JSON-safe list."""
    return [serialize_doc(d) for d in docs]
