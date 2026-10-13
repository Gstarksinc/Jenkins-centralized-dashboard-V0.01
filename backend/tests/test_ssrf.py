import pytest
from app.core.ssrf_guard import validate_jenkins_url, SSRFValidationError


def test_ssrf_rejects_invalid_schemes():
    """Verify schemes other than http/https are rejected."""
    with pytest.raises(SSRFValidationError, match="Only http and https are permitted"):
        validate_jenkins_url("ftp://example.com")

    with pytest.raises(SSRFValidationError, match="Only http and https are permitted"):
        validate_jenkins_url("file:///etc/passwd")


def test_ssrf_rejects_localhost_and_loopback():
    """Verify loopback addresses are blocked by default."""
    with pytest.raises(SSRFValidationError):
        validate_jenkins_url("http://localhost:8080")

    with pytest.raises(SSRFValidationError):
        validate_jenkins_url("http://127.0.0.1:8080")


def test_ssrf_rejects_cloud_metadata():
    """Verify link-local cloud metadata (AWS/Azure/GCP 169.254.169.254) is blocked."""
    with pytest.raises(SSRFValidationError):
        validate_jenkins_url("http://169.254.169.254/latest/meta-data/")
