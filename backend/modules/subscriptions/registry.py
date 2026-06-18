from sqlalchemy.orm import Session
from .models import Plan, Feature, PlanFeature

import os
import json

base_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.abspath(os.path.join(base_dir, "../../../sentinel/registry/subscription_rules.json"))

try:
    with open(json_path, "r") as f:
        _rules = json.load(f)
    ALL_FEATURES = {k: v["name"] for k, v in _rules["features"].items()}
    DEFAULT_PLANS = _rules["plans"]
except Exception as _e:
    print(f"WARNING: Could not load centralized rules from {json_path}: {_e}")
    ALL_FEATURES = {
        "visits": "Visits Tracking",
        "customers": "Customer Management",
        "review_sms": "Review SMS",
        "loyalty": "Loyalty Programs",
        "campaigns": "Marketing Campaigns",
        "smart_segments": "Smart Customer Segmentation",
        "intelligence": "Business Intelligence & Insights",
        "automation": "Marketing & Operational Automation",
        "advanced_analytics": "Advanced Analytics Reports",
        "governance": "Audit Logging & Operational Governance"
    }
    DEFAULT_PLANS = {
        "STARTER": {
            "tier": 1,
            "features": ["visits", "customers", "review_sms"]
        },
        "GROWTH": {
            "tier": 2,
            "features": ["visits", "customers", "review_sms", "loyalty", "campaigns", "smart_segments"]
        },
        "PRO": {
            "tier": 3,
            "features": ["visits", "customers", "review_sms", "loyalty", "campaigns", "smart_segments", "intelligence", "automation", "advanced_analytics", "governance"]
        },
        "ENTERPRISE_READY": {
            "tier": 4,
            "features": ["visits", "customers", "review_sms", "loyalty", "campaigns", "smart_segments", "intelligence", "automation", "advanced_analytics", "governance"]
        }
    }


def seed_plans(db: Session):
    """
    Seed features, plans, and plan features in the database.
    """
    # 1. Seed unique features
    db_features = {}
    for code, name in ALL_FEATURES.items():
        feature = db.query(Feature).filter(Feature.code == code).first()
        if not feature:
            feature = Feature(code=code, name=name)
            db.add(feature)
            db.flush()
        db_features[code] = feature

    # 2. Seed plans and associate them with features
    for name, data in DEFAULT_PLANS.items():
        plan = db.query(Plan).filter(Plan.name == name).first()
        if not plan:
            plan = Plan(name=name, tier=data["tier"])
            db.add(plan)
            db.flush()
        
        # Current mapped feature codes
        current_feature_ids = {pf.feature_id for pf in plan.features}
        for f_code in data["features"]:
            f_obj = db_features.get(f_code)
            if f_obj and f_obj.id not in current_feature_ids:
                pf = PlanFeature(plan_id=plan.id, feature_id=f_obj.id)
                db.add(pf)
    db.commit()

def has_feature_access_db(db: Session, plan_name: str, feature_name: str) -> bool:
    """
    Check if a plan has access to a feature using the database.
    """
    # Find plan and check if a mapping exists in plan_features for the given feature code
    feature_mapping = db.query(PlanFeature).join(Feature).join(Plan).filter(
        Plan.name == plan_name,
        Feature.code == feature_name
    ).first()
    
    return feature_mapping is not None

def check_job_feature_access(db: Session, feature_name: str, restaurant_id: int) -> bool:
    """
    Check if the active subscription for the given restaurant has access to the feature.
    """
    from modules.subscriptions.models import Subscription
    
    sub = db.query(Subscription).filter(
        Subscription.restaurant_id == restaurant_id,
        Subscription.status == "ACTIVE"
    ).first()
    
    if sub:
        return has_feature_access_db(db, sub.plan.name, feature_name)
    return has_feature_access_db(db, "STARTER", feature_name)
