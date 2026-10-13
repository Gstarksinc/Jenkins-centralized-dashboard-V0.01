from app.config import Settings


def test_settings_defaults():
    """Verify default configurations have secure and reasonable settings."""
    cfg = Settings()
    assert cfg.APP_NAME == "Jenkins Control Center"
    assert cfg.BACKEND_PORT == 8000
    assert cfg.SESSION_EXPIRE_HOURS >= 1
    assert cfg.RATE_LIMIT_LOGIN_ATTEMPTS > 0
    assert cfg.ALLOW_PRIVATE_IPS_FOR_JENKINS is False  # SSRF protection default
