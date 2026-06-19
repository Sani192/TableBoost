"""initial_schema

Revision ID: 0001
Revises:
Create Date: 2026-06-19

Creates all 27 tables for the TableBoost platform from scratch.
This is the squashed baseline — all prior incremental migrations have been
folded into this single file.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all tables."""

    # ── Foundation tables (no foreign-key dependencies) ──────────────

    op.create_table(
        'user_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=True),
        sa.Column('last_name', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_user_profiles_id'), 'user_profiles', ['id'])

    op.create_table(
        'restaurants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('timezone', sa.String(), nullable=False, server_default='UTC'),
        sa.Column('owner_details', sa.JSON(), nullable=True),
        sa.Column('restaurant_details', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(), server_default='ACTIVE'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_restaurants_id'), 'restaurants', ['id'])

    op.create_table(
        'sub_features',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
    )
    op.create_index(op.f('ix_sub_features_id'), 'sub_features', ['id'])
    op.create_index(op.f('ix_sub_features_code'), 'sub_features', ['code'], unique=True)

    op.create_table(
        'sub_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('tier', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )
    op.create_index(op.f('ix_sub_plans_id'), 'sub_plans', ['id'])
    op.create_index(op.f('ix_sub_plans_name'), 'sub_plans', ['name'], unique=True)

    # ── Users (depends on user_profiles) ─────────────────────────────

    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('profile_id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('token_version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['profile_id'], ['user_profiles.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('profile_id'),
        sa.UniqueConstraint('username'),
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'])
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # ── Link & subscription tables ───────────────────────────────────

    op.create_table(
        'restaurant_users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('restaurant_id', 'user_id', name='uix_restaurant_user'),
    )
    op.create_index(op.f('ix_restaurant_users_id'), 'restaurant_users', ['id'])

    op.create_table(
        'sub_plan_features',
        sa.Column('plan_id', sa.Integer(), nullable=False),
        sa.Column('feature_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['plan_id'], ['sub_plans.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['feature_id'], ['sub_features.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('plan_id', 'feature_id'),
    )

    op.create_table(
        'sub_subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('plan_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='ACTIVE'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.ForeignKeyConstraint(['plan_id'], ['sub_plans.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('restaurant_id'),
    )
    op.create_index(op.f('ix_sub_subscriptions_id'), 'sub_subscriptions', ['id'])

    # ── Settings ─────────────────────────────────────────────────────

    op.create_table(
        'settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(), nullable=True),
        sa.Column('value_bool', sa.Boolean(), nullable=True),
        sa.Column('value_str', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('restaurant_id', 'key', name='uix_restaurant_key'),
    )
    op.create_index(op.f('ix_settings_id'), 'settings', ['id'])
    op.create_index(op.f('ix_settings_restaurant_id'), 'settings', ['restaurant_id'])
    op.create_index(op.f('ix_settings_key'), 'settings', ['key'])

    # ── Customers ────────────────────────────────────────────────────

    op.create_table(
        'customers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('phone_number', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('restaurant_id', 'phone_number', name='uix_restaurant_phone'),
    )
    op.create_index(op.f('ix_customers_id'), 'customers', ['id'])
    op.create_index(op.f('ix_customers_restaurant_id'), 'customers', ['restaurant_id'])
    op.create_index(op.f('ix_customers_phone_number'), 'customers', ['phone_number'])

    op.create_table(
        'customer_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('birthday', sa.Date(), nullable=True),
        sa.Column('anniversary', sa.Date(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('customer_id'),
    )
    op.create_index(op.f('ix_customer_profiles_id'), 'customer_profiles', ['id'])
    op.create_index(op.f('ix_customer_profiles_restaurant_id'), 'customer_profiles', ['restaurant_id'])

    # ── Campaigns & Messages ─────────────────────────────────────────

    op.create_table(
        'campaigns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('message_template', sa.String(), nullable=False),
        sa.Column('audience_type', sa.String(), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(), server_default='draft'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_campaigns_id'), 'campaigns', ['id'])
    op.create_index(op.f('ix_campaigns_restaurant_id'), 'campaigns', ['restaurant_id'])

    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('campaign_id', sa.Integer(), nullable=True),
        sa.Column('message_text', sa.String(), nullable=False),
        sa.Column('type', sa.String(), server_default='review'),
        sa.Column('status', sa.String(), server_default='sent'),
        sa.Column('sent_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_messages_id'), 'messages', ['id'])
    op.create_index(op.f('ix_messages_restaurant_id'), 'messages', ['restaurant_id'])

    # ── Visits ───────────────────────────────────────────────────────

    op.create_table(
        'visits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='active'),
        sa.Column('visited_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_visits_id'), 'visits', ['id'])
    op.create_index(op.f('ix_visits_restaurant_id'), 'visits', ['restaurant_id'])

    # ── Loyalty ──────────────────────────────────────────────────────

    op.create_table(
        'loyalty_rewards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('required_visits', sa.Integer(), nullable=False),
        sa.Column('reward_type', sa.String(), server_default='milestone'),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_loyalty_rewards_id'), 'loyalty_rewards', ['id'])
    op.create_index(op.f('ix_loyalty_rewards_restaurant_id'), 'loyalty_rewards', ['restaurant_id'])

    op.create_table(
        'loyalty_progress',
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('lifetime_visits', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.PrimaryKeyConstraint('customer_id'),
    )

    op.create_table(
        'reward_redemptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('reward_id', sa.Integer(), nullable=True),
        sa.Column('reward_name', sa.String(), nullable=False),
        sa.Column('visits_threshold', sa.Integer(), nullable=False),
        sa.Column('redeemed_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.ForeignKeyConstraint(['reward_id'], ['loyalty_rewards.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_reward_redemptions_id'), 'reward_redemptions', ['id'])
    op.create_index(op.f('ix_reward_redemptions_restaurant_id'), 'reward_redemptions', ['restaurant_id'])

    # ── Automation ───────────────────────────────────────────────────

    op.create_table(
        'automation_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('automation_type', sa.String(), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), nullable=True),
        sa.Column('message_template', sa.String(), nullable=False),
        sa.Column('schedule', sa.String(), nullable=True),
        sa.Column('settings', sa.JSON(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_automation_configs_id'), 'automation_configs', ['id'])
    op.create_index(op.f('ix_automation_configs_restaurant_id'), 'automation_configs', ['restaurant_id'])

    op.create_table(
        'automation_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('automation_type', sa.String(), nullable=False),
        sa.Column('reference_period', sa.String(), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_automation_history_id'), 'automation_history', ['id'])
    op.create_index(op.f('ix_automation_history_restaurant_id'), 'automation_history', ['restaurant_id'])

    # ── Intelligence ─────────────────────────────────────────────────

    op.create_table(
        'customer_intelligence',
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('clv_score', sa.Float(), nullable=True),
        sa.Column('clv_tier', sa.String(10), nullable=True),
        sa.Column('total_spent', sa.Float(), nullable=True),
        sa.Column('visit_count', sa.Integer(), nullable=True),
        sa.Column('avg_visit_gap_days', sa.Float(), nullable=True),
        sa.Column('last_visit_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('health_status', sa.String(15), nullable=True),
        sa.Column('health_score', sa.Integer(), nullable=True),
        sa.Column('spend_trend', sa.String(10), nullable=True),
        sa.Column('computed_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.PrimaryKeyConstraint('customer_id'),
    )
    op.create_index(op.f('ix_customer_intelligence_restaurant_id'), 'customer_intelligence', ['restaurant_id'])

    op.create_table(
        'campaign_summaries',
        sa.Column('campaign_id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('total_sent', sa.Integer(), nullable=True),
        sa.Column('total_converted', sa.Integer(), nullable=True),
        sa.Column('conversion_rate', sa.Float(), nullable=True),
        sa.Column('revenue_attributed', sa.Float(), nullable=True),
        sa.Column('computed_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id']),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.PrimaryKeyConstraint('campaign_id'),
    )
    op.create_index(op.f('ix_campaign_summaries_restaurant_id'), 'campaign_summaries', ['restaurant_id'])

    op.create_table(
        'reward_summaries',
        sa.Column('reward_id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('total_redeemed', sa.Integer(), nullable=True),
        sa.Column('eligible_count', sa.Integer(), nullable=True),
        sa.Column('redemption_rate', sa.Float(), nullable=True),
        sa.Column('post_reward_revisit_rate', sa.Float(), nullable=True),
        sa.Column('reward_influenced_revenue', sa.Float(), nullable=True),
        sa.Column('computed_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['reward_id'], ['loyalty_rewards.id']),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.PrimaryKeyConstraint('reward_id'),
    )
    op.create_index(op.f('ix_reward_summaries_restaurant_id'), 'reward_summaries', ['restaurant_id'])

    op.create_table(
        'automation_summaries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('automation_type', sa.String(50), nullable=False),
        sa.Column('period_month', sa.String(7), nullable=False),
        sa.Column('messages_sent', sa.Integer(), nullable=True),
        sa.Column('revisit_count', sa.Integer(), nullable=True),
        sa.Column('revisit_rate', sa.Float(), nullable=True),
        sa.Column('revenue_attributed', sa.Float(), nullable=True),
        sa.Column('computed_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_automation_summaries_id'), 'automation_summaries', ['id'])
    op.create_index(op.f('ix_automation_summaries_restaurant_id'), 'automation_summaries', ['restaurant_id'])
    op.create_index(op.f('ix_automation_summaries_automation_type'), 'automation_summaries', ['automation_type'])
    op.create_index(op.f('ix_automation_summaries_period_month'), 'automation_summaries', ['period_month'])

    op.create_table(
        'business_summaries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('period_type', sa.String(10), nullable=False),
        sa.Column('period_start', sa.DateTime(), nullable=False),
        sa.Column('period_end', sa.DateTime(), nullable=False),
        sa.Column('metrics', sa.JSON(), nullable=False),
        sa.Column('trends', sa.JSON(), nullable=True),
        sa.Column('highlights', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_business_summaries_id'), 'business_summaries', ['id'])
    op.create_index(op.f('ix_business_summaries_restaurant_id'), 'business_summaries', ['restaurant_id'])
    op.create_index(op.f('ix_business_summaries_period_type'), 'business_summaries', ['period_type'])

    op.create_table(
        'recommendations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=False),
        sa.Column('rule_id', sa.String(10), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('priority', sa.String(10), nullable=False),
        sa.Column('action_type', sa.String(30), nullable=True),
        sa.Column('action_params', sa.JSON(), nullable=True),
        sa.Column('is_dismissed', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_recommendations_id'), 'recommendations', ['id'])
    op.create_index(op.f('ix_recommendations_restaurant_id'), 'recommendations', ['restaurant_id'])
    op.create_index(op.f('ix_recommendations_priority'), 'recommendations', ['priority'])
    op.create_index(op.f('ix_recommendations_is_dismissed'), 'recommendations', ['is_dismissed'])

    # ── Governance ───────────────────────────────────────────────────

    op.create_table(
        'gov_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('actor_username', sa.String(), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=True),
        sa.Column('entity_id', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_gov_audit_logs_id'), 'gov_audit_logs', ['id'])
    op.create_index(op.f('ix_gov_audit_logs_restaurant_id'), 'gov_audit_logs', ['restaurant_id'])
    op.create_index(op.f('ix_gov_audit_logs_timestamp'), 'gov_audit_logs', ['timestamp'])
    op.create_index(op.f('ix_gov_audit_logs_actor_id'), 'gov_audit_logs', ['actor_id'])
    op.create_index(op.f('ix_gov_audit_logs_actor_username'), 'gov_audit_logs', ['actor_username'])
    op.create_index(op.f('ix_gov_audit_logs_action'), 'gov_audit_logs', ['action'])
    op.create_index(op.f('ix_gov_audit_logs_entity_type'), 'gov_audit_logs', ['entity_type'])
    op.create_index(op.f('ix_gov_audit_logs_entity_id'), 'gov_audit_logs', ['entity_id'])
    op.create_index(op.f('ix_gov_audit_logs_status'), 'gov_audit_logs', ['status'])

    op.create_table(
        'gov_operational_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('restaurant_id', sa.Integer(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('log_type', sa.String(), nullable=False),
        sa.Column('event_name', sa.String(), nullable=False),
        sa.Column('job_id', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('message', sa.String(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_gov_operational_logs_id'), 'gov_operational_logs', ['id'])
    op.create_index(op.f('ix_gov_operational_logs_restaurant_id'), 'gov_operational_logs', ['restaurant_id'])
    op.create_index(op.f('ix_gov_operational_logs_timestamp'), 'gov_operational_logs', ['timestamp'])
    op.create_index(op.f('ix_gov_operational_logs_log_type'), 'gov_operational_logs', ['log_type'])
    op.create_index(op.f('ix_gov_operational_logs_event_name'), 'gov_operational_logs', ['event_name'])
    op.create_index(op.f('ix_gov_operational_logs_job_id'), 'gov_operational_logs', ['job_id'])
    op.create_index(op.f('ix_gov_operational_logs_status'), 'gov_operational_logs', ['status'])


def downgrade() -> None:
    """Drop all tables in reverse dependency order."""
    op.drop_table('gov_operational_logs')
    op.drop_table('gov_audit_logs')
    op.drop_table('recommendations')
    op.drop_table('business_summaries')
    op.drop_table('automation_summaries')
    op.drop_table('reward_summaries')
    op.drop_table('campaign_summaries')
    op.drop_table('customer_intelligence')
    op.drop_table('automation_history')
    op.drop_table('automation_configs')
    op.drop_table('reward_redemptions')
    op.drop_table('loyalty_progress')
    op.drop_table('loyalty_rewards')
    op.drop_table('visits')
    op.drop_table('messages')
    op.drop_table('campaigns')
    op.drop_table('customer_profiles')
    op.drop_table('customers')
    op.drop_table('settings')
    op.drop_table('sub_subscriptions')
    op.drop_table('sub_plan_features')
    op.drop_table('restaurant_users')
    op.drop_table('users')
    op.drop_table('sub_plans')
    op.drop_table('sub_features')
    op.drop_table('restaurants')
    op.drop_table('user_profiles')
