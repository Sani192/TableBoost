"""
Unit tests for backend.modules.settings.service

Covers:
  - get_setting: default fallback, boolean retrieval, string retrieval
  - set_setting: create new, update existing, bool vs string storage
"""

import pytest

from modules.settings.service import get_setting, set_setting
from modules.settings.models import Setting


# ============================================================================
# get_setting
# ============================================================================

class TestGetSetting:
    """Tests for the get_setting function."""

    def test_returns_default_when_key_not_found(self, db):
        result = get_setting(db, "nonexistent_key", default="fallback")
        assert result == "fallback"

    def test_returns_none_when_key_not_found_and_no_default(self, db):
        result = get_setting(db, "nonexistent_key")
        assert result is None

    def test_returns_value_bool_for_boolean_setting(self, db, create_setting):
        create_setting(key="auto_send_sms", value_bool=True)

        result = get_setting(db, "auto_send_sms")
        assert result is True

    def test_returns_false_bool_correctly(self, db, create_setting):
        create_setting(key="auto_send_sms", value_bool=False)

        result = get_setting(db, "auto_send_sms")
        assert result is False

    def test_returns_value_str_for_string_setting(self, db, create_setting):
        create_setting(key="review_message_template", value_str="Hello {name}")

        result = get_setting(db, "review_message_template")
        assert result == "Hello {name}"

    def test_returns_default_when_value_str_is_empty(self, db, create_setting):
        """Empty string is falsy → should fall back to default."""
        create_setting(key="some_key", value_str="")

        result = get_setting(db, "some_key", default="fallback")
        assert result == "fallback"

    def test_bool_takes_priority_over_str(self, db, create_setting):
        """When both value_bool and value_str are set, bool wins."""
        create_setting(key="mixed", value_bool=True, value_str="ignored")

        result = get_setting(db, "mixed")
        assert result is True


# ============================================================================
# set_setting
# ============================================================================

class TestSetSetting:
    """Tests for the set_setting function."""

    def test_creates_new_setting_for_unknown_key(self, db):
        set_setting(db, "new_key", "new_value")

        setting = db.query(Setting).filter(Setting.key == "new_key").first()
        assert setting is not None
        assert setting.value_str == "new_value"

    def test_updates_existing_setting(self, db, create_setting):
        create_setting(key="existing_key", value_str="old_value")
        db.commit()

        set_setting(db, "existing_key", "new_value")

        setting = db.query(Setting).filter(Setting.key == "existing_key").first()
        assert setting.value_str == "new_value"
        # Should not create a duplicate row
        assert db.query(Setting).filter(Setting.key == "existing_key").count() == 1

    def test_stores_bool_in_value_bool_column(self, db):
        result = set_setting(db, "flag", True)

        assert result.value_bool is True

    def test_stores_false_bool_in_value_bool_column(self, db):
        result = set_setting(db, "flag", False)

        assert result.value_bool is False

    def test_stores_string_in_value_str_column(self, db):
        result = set_setting(db, "template", "Hi {name}")

        assert result.value_str == "Hi {name}"

    def test_returns_refreshed_setting_object(self, db):
        result = set_setting(db, "key", "value")

        assert result.id is not None
        assert result.key == "key"
