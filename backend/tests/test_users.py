from app.core.security import verify_password
from app.models.user import User


def test_list_roles(client):
    """Verify default system roles are returned."""
    response = client.get("/api/v1/roles")
    assert response.status_code == 200
    roles = response.json()
    role_names = [r["name"] for r in roles]
    assert "Platform Administrator" in role_names
    assert "Developer" in role_names


def test_create_and_list_users(client, db_session):
    """Verify creating a user hashes password using Argon2id and can be retrieved."""
    create_payload = {
        "email": "engineer@company.com",
        "display_name": "DevOps Engineer",
        "password": "SuperSecurePassword123!",
        "role_name": "Developer",
    }
    response = client.post("/api/v1/users", json=create_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "engineer@company.com"
    assert data["display_name"] == "DevOps Engineer"
    assert data["status"] == "ACTIVE"
    assert len(data["roles"]) > 0

    # Verify password was hashed in database and NOT saved in plaintext
    db_user = db_session.query(User).filter(User.email == "engineer@company.com").first()
    assert db_user is not None
    assert db_user.password_hash != "SuperSecurePassword123!"
    assert verify_password("SuperSecurePassword123!", db_user.password_hash) is True

    # Verify user appears in user listing
    list_res = client.get("/api/v1/users")
    assert list_res.status_code == 200
    emails = [u["email"] for u in list_res.json()]
    assert "engineer@company.com" in emails


def test_duplicate_email_rejected(client):
    """Verify creating two users with the same email returns 400 error."""
    payload = {
        "email": "unique@company.com",
        "display_name": "First User",
        "password": "Password12345!",
    }
    res1 = client.post("/api/v1/users", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/users", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]
