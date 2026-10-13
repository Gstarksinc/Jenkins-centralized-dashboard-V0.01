from unittest.mock import patch
from app.core.security import decrypt_secret
from app.models.credential import CredentialReference


def test_test_connection_ssrf_blocked(client):
    """Verify test-connection endpoint blocks private IP destinations."""
    payload = {
        "base_url": "http://127.0.0.1:8080",
        "username": "admin",
        "secret_token": "secret123",
    }
    response = client.post("/api/v1/servers/test-connection", json=payload)
    assert response.status_code == 400
    assert "SSRF Policy Violation" in response.json()["detail"]


@patch("app.integrations.jenkins.client.JenkinsClient.test_connection")
def test_create_and_list_server(mock_test_conn, client, db_session):
    """Verify server registration encrypts secrets and never returns them in responses."""
    mock_test_conn.return_value = {
        "online": True,
        "status": "ONLINE",
        "version": "2.440.3",
        "message": "Connected successfully",
        "description": "Production controller",
    }

    create_payload = {
        "name": "EU Production Jenkins",
        "base_url": "https://jenkins-prod.example.com",
        "environment": "production",
        "description": "Primary build cluster",
        "auth_type": "TOKEN",
        "username": "svc-account",
        "secret_token": "highly-secret-jenkins-api-token-xyz",
        "collection_interval_seconds": 60,
        "connection_timeout_seconds": 15,
        "tags": ["prod", "eu"],
    }
    response = client.post("/api/v1/servers", json=create_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "EU Production Jenkins"
    assert data["status"] == "ONLINE"
    assert data["version_info"] == "2.440.3"
    # Verify no credentials or secret token is returned
    assert "secret_token" not in data
    assert "encrypted_secret" not in data

    import uuid
    server_id = uuid.UUID(data["id"])
    cred = db_session.query(CredentialReference).filter(CredentialReference.server_id == server_id).first()
    assert cred is not None
    assert cred.encrypted_secret != "highly-secret-jenkins-api-token-xyz"
    assert decrypt_secret(cred.encrypted_secret) == "highly-secret-jenkins-api-token-xyz"

    # Verify server listing
    list_res = client.get("/api/v1/servers")
    assert list_res.status_code == 200
    server_names = [s["name"] for s in list_res.json()]
    assert "EU Production Jenkins" in server_names
