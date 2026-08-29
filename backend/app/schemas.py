from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, List
from datetime import date

# 1. Activities
class ActivitySchema(BaseModel):
    activity_type: str = Field(default="other", description="Type of activity")
    title: Optional[str] = None
    steps: int = 0
    distance_km: float = 0.0
    duration_minutes: float = 0.0
    calories_burned: float = 0.0
    heart_rate_avg: Optional[int] = None
    activity_date: str = Field(default_factory=lambda: str(date.today()))
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    source: str = "manual"
    source_id: Optional[str] = None
    notes: Optional[str] = None

# 2. Manual Food
class ManualFoodSchema(BaseModel):
    food_item: str = Field(..., min_length=1, description="Name of the food item")
    calories: float = Field(..., ge=0)
    protein_g: float = 0.0
    carbs_g: float = 0.0
    fats_g: float = 0.0
    fiber_g: float = 0.0
    sugar_g: float = 0.0
    sodium_mg: float = 0.0
    category: str = "Other"
    meal_type: str = "lunch"
    cost: float = 0.0
    log_date: str = Field(default_factory=lambda: str(date.today()))

# 3. Water
class WaterLogSchema(BaseModel):
    amount_ml: int = Field(..., gt=0, le=5000, description="Amount of water in ml")
    log_date: str = Field(default_factory=lambda: str(date.today()))

# 4. Social
class SocialPostSchema(BaseModel):
    username: str = "Anonymous User"
    avatar_url: Optional[str] = None
    text_content: str = ""
    shared_type: Optional[str] = None
    shared_data: Optional[Dict[str, Any]] = None

# 5. Profile
class UserProfileSchema(BaseModel):
    daily_calorie_goal: int = 2000
    daily_protein_goal_g: int = 150
    daily_carbs_goal_g: int = 250
    daily_fats_goal_g: int = 65
    daily_budget_usd: float = 500.0
    preferred_currency: str = "INR"
    daily_step_goal: int = 10000
    daily_active_minutes_goal: int = 30
    daily_water_goal_ml: int = 3000
    display_name: Optional[str] = None

# 6. ML Prediction
class PredictionSchema(BaseModel):
    calories: float = 500.0
    cost: float = 10.0
    category: str = "Other"

# 7. LLM Analyze
class LLMAnalyzeSchema(BaseModel):
    text: str = Field(..., min_length=1)
    meal_type: str = "lunch"

# 8. Goals
class GoalSchema(BaseModel):
    daily_calorie_goal: int = 2000
    daily_protein_goal_g: int = 150
    daily_carbs_goal_g: int = 250
    daily_fats_goal_g: int = 65
    daily_budget_usd: float = 30.0
    goal_description: str = "Eat healthier"
    target_weeks: int = 4

# 9. Chat
class ChatSchema(BaseModel):
    message: str = Field(..., min_length=1)
