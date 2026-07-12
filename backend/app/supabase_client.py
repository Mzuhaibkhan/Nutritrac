import os
from supabase import create_client, Client
import re
import supabase.client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

# Bypass supabase-py JWT validation for new 'sb_' opaque tokens if applicable
try:
    if hasattr(supabase.client, "re"):
        _original_match = supabase.client.re.match
        def _mock_match(pattern, string, flags=0):
            if isinstance(string, str) and string.startswith("sb_"):
                return True
            return _original_match(pattern, string, flags)
        supabase.client.re.match = _mock_match
except Exception:
    pass

_supabase: Client | None = None


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        url = os.environ.get("SUPABASE_URL")
        if not url:
            raise KeyError("SUPABASE_URL is not set in the environment.")
            
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
        if not key:
            raise KeyError("Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_KEY is set in the environment.")
            
        _supabase = create_client(url, key)
    return _supabase


supabase = get_supabase()

