"""Social sharing groundwork."""
from flask import Blueprint, request, jsonify, g
from ..mongo_client import get_db, serialize_docs, serialize_doc, new_id, now_iso
from ..auth import require_auth
from ..schemas import SocialPostSchema

social_bp = Blueprint("social", __name__)


@social_bp.route("/social/posts", methods=["POST"])
@require_auth
def create_post():
    data = SocialPostSchema(**request.get_json())
    db = get_db()

    post = {
        "id": new_id(),
        "user_id": g.user_id,
        "username": data.username,
        "avatar_url": data.avatar_url,
        "text_content": data.text_content.strip(),
        "shared_type": data.shared_type,  # 'meal', 'activity', or 'text'
        "shared_data": data.shared_data,  # Contains nutrition or activity dict
        "likes": [],  # List of user_ids who liked this post
        "created_at": now_iso()
    }

    db.posts.insert_one(post)
    return jsonify(serialize_doc(post))


@social_bp.route("/social/feed", methods=["GET"])
@require_auth
def get_feed():
    """Get the global community feed (sorted by newest first)."""
    db = get_db()
    posts = db.posts.find().sort("created_at", -1).limit(50)
    return jsonify(serialize_docs(posts))


@social_bp.route("/social/posts/<post_id>/like", methods=["POST"])
@require_auth
def toggle_like(post_id):
    """Toggle liking a shared post."""
    db = get_db()
    post = db.posts.find_one({"id": post_id})
    if not post:
        return jsonify({"error": "Post not found"}), 404

    likes = post.get("likes", [])
    if g.user_id in likes:
        # Unlike
        db.posts.update_one({"id": post_id}, {"$pull": {"likes": g.user_id}})
        liked = False
    else:
        # Like
        db.posts.update_one({"id": post_id}, {"$addToSet": {"likes": g.user_id}})
        liked = True

    return jsonify({"success": True, "liked": liked})
