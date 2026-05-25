import logging
from sqlalchemy.orm import Session
from provisioning.schemas import ProvisionRequest, ProvisionResponse
from provisioning.core.restaurant import provision_restaurant
from provisioning.core.subscription import provision_subscription
from provisioning.core.rbac import provision_users_and_rbac
from provisioning.core.automation import provision_automations_and_loyalty
from modules.automation.service import sync_scheduler
from core.scheduler import scheduler
from modules.governance.service import log_audit_event

logger = logging.getLogger(__name__)

def execute_provisioning_pipeline(db: Session, req: ProvisionRequest, actor_user=None) -> ProvisionResponse:
    actions_taken = []
    
    # We use a nested transaction (savepoint) or start a transaction if none is active
    # Using db.begin_nested() is standard for SQLAlchemy when inside an outer session/transaction scope
    # to support rollback cleanly without closing the main connection session.
    transaction = db.begin_nested()
    
    try:
        # 1. Provision Restaurant & Settings
        restaurant = provision_restaurant(db, req.restaurant_name, req.timezone, actions_taken)
        
        # 2. Provision Subscription
        provision_subscription(db, restaurant.id, req.plan_name, actions_taken)
        
        # 3. Provision unique Users and RBAC
        owner, manager, staff = provision_users_and_rbac(
            db, 
            restaurant.id, 
            req.owner_username, 
            req.owner_password, 
            actions_taken
        )
        
        # 4. Provision default Automations & Loyalty Milestone Rewards
        provision_automations_and_loyalty(db, restaurant.id, actions_taken)
        
        # 5. Handle Dry-Run or Commit
        if req.dryRun:
            transaction.rollback()
            actions_taken.append("Dry-run mode active: Transaction rolled back successfully.")
            logger.info(f"Dry-run provisioning completed for: {req.restaurant_name}")
            
            return ProvisionResponse(
                success=True,
                dryRun=True,
                restaurant_id=None,
                restaurant_name=req.restaurant_name,
                owner_username=owner.username,
                manager_username=manager.username,
                staff_username=staff.username,
                plan_assigned=req.plan_name.upper(),
                actions_taken=actions_taken
            )
        else:
            transaction.commit()
            logger.info(f"Successfully provisioned restaurant: {req.restaurant_name} (ID: {restaurant.id})")
            
            # Sync the background scheduler immediately with the new configurations
            try:
                sync_scheduler(scheduler, db)
                actions_taken.append("Synchronized active background scheduler jobs")
            except Exception as e:
                logger.error(f"Failed to sync scheduler during provisioning: {e}", exc_info=True)
                actions_taken.append(f"Warning: Scheduler synchronization failed: {str(e)}")

            # Log audit event
            actor_id = actor_user.id if actor_user else None
            actor_username = actor_user.username if actor_user else "system"
            
            log_audit_event(
                db,
                restaurant_id=restaurant.id,
                actor_id=actor_id,
                actor_username=actor_username,
                action="PROVISION_RESTAURANT",
                entity_type="Restaurant",
                entity_id=str(restaurant.id),
                status="SUCCESS",
                metadata_json={
                    "restaurant_name": req.restaurant_name,
                    "plan_assigned": req.plan_name.upper(),
                    "owner_username": owner.username
                }
            )
            
            return ProvisionResponse(
                success=True,
                dryRun=False,
                restaurant_id=restaurant.id,
                restaurant_name=restaurant.name,
                owner_username=owner.username,
                manager_username=manager.username,
                staff_username=staff.username,
                plan_assigned=req.plan_name.upper(),
                actions_taken=actions_taken
            )
            
    except Exception as e:
        transaction.rollback()
        db.rollback() # Clear all pending session state to avoid flush integrity errors on subsequent commits
        logger.error(f"Provisioning pipeline failed: {e}", exc_info=True)
        # Log failed audit event
        if not req.dryRun:
            actor_id = actor_user.id if actor_user else None
            actor_username = actor_user.username if actor_user else "system"
            try:
                log_audit_event(
                    db,
                    restaurant_id=None,
                    actor_id=actor_id,
                    actor_username=actor_username,
                    action="PROVISION_RESTAURANT",
                    entity_type="Restaurant",
                    status="FAILED",
                    metadata_json={
                        "restaurant_name": req.restaurant_name,
                        "error": str(e)
                    }
                )
            except Exception as audit_err:
                logger.error(f"Failed to log failed provisioning audit event: {audit_err}")
        raise e
