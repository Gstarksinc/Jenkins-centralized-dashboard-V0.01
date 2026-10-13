def test_liveness_endpoint(client):
    """Test the /api/v1/health/live endpoint returns 200 and healthy status."""
    response = client.get("/api/v1/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data


def test_root_endpoint(client):
    """Test the root / endpoint returns metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data


def test_correlation_id_header(client):
    """Test that X-Correlation-ID is propagated or generated."""
    response = client.get("/api/v1/health/live", headers={"X-Correlation-ID": "custom-trace-123"})
    assert response.status_code == 200
    assert response.headers.get("X-Correlation-ID") == "custom-trace-123"
    assert "X-Process-Time" in response.headers
