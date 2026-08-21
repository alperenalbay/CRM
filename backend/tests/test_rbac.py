from fastapi.testclient import TestClient
from sqlalchemy import delete, text

from app.core.database import SessionLocal
from app.main import app
from app.models.user import User

client = TestClient(app)

TEST_USERNAME = "rbac_pytest_user"
TEST_PASSWORD = "TestPass123"


def _purge_test_user() -> None:
    with SessionLocal() as db:
        db.execute(
            text(
                "DELETE FROM user_permission_groups "
                "WHERE user_id IN (SELECT id FROM users WHERE username = :username)"
            ),
            {"username": TEST_USERNAME},
        )
        db.execute(delete(User).where(User.username == TEST_USERNAME))
        db.commit()


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _login(username: str, password: str) -> str:
    response = client.post(
        "/api/v1/auth/login", json={"username": username, "password": password}
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def test_me_returns_permissions_and_groups() -> None:
    token = _login("admin", "admin123")
    response = client.get("/api/v1/auth/me", headers=_auth_headers(token))
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["permissions"], list)
    assert isinstance(body["groups"], list)
    assert body["role"] == "admin"


def test_read_only_user_is_denied_write_actions() -> None:
    _purge_test_user()
    admin_token = _login("admin", "admin123")
    groups_response = client.get(
        "/api/v1/groups", headers=_auth_headers(admin_token)
    )
    assert groups_response.status_code == 200
    ro_group = next(
        g for g in groups_response.json() if g["code"] == "salt_okunur"
    )

    create_response = client.post(
        "/api/v1/users",
        json={
            "username": TEST_USERNAME,
            "full_name": "RBAC Test",
            "password": TEST_PASSWORD,
            "role_code": "support",
            "group_ids": [ro_group["id"]],
        },
        headers=_auth_headers(admin_token),
    )
    assert create_response.status_code == 201, create_response.text
    user_id = create_response.json()["id"]
    try:
        user_token = _login(TEST_USERNAME, TEST_PASSWORD)

        assert client.get(
            "/api/v1/customers", headers=_auth_headers(user_token)
        ).status_code == 200

        assert (
            client.post(
                "/api/v1/customers",
                json={"company_name": "Yetkisiz Müşteri"},
                headers=_auth_headers(user_token),
            ).status_code
            == 403
        )

        assert (
            client.get("/api/v1/users", headers=_auth_headers(user_token)).status_code
            == 403
        )

        groups = client.get("/api/v1/groups", headers=_auth_headers(admin_token)).json()
        du_group = next(g for g in groups if g["code"] == "destek_uzmani")
        update_response = client.patch(
            f"/api/v1/users/{user_id}",
            json={"group_ids": [du_group["id"]]},
            headers=_auth_headers(admin_token),
        )
        assert update_response.status_code == 200, update_response.text
        permissions = update_response.json()["permissions"]
        assert "tickets.change_status" in permissions
        assert "customers.delete" not in permissions

        deactivate_response = client.patch(
            f"/api/v1/users/{user_id}",
            json={"is_active": False},
            headers=_auth_headers(admin_token),
        )
        assert deactivate_response.status_code == 200

        login_after_deactivate = client.post(
            "/api/v1/auth/login",
            json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
        )
        assert login_after_deactivate.status_code in (401, 403)
    finally:
        _purge_test_user()


def test_admin_bypasses_permission_checks() -> None:
    admin_token = _login("admin", "admin123")
    assert (
        client.get("/api/v1/permissions", headers=_auth_headers(admin_token)).status_code
        == 200
    )
    assert (
        client.get("/api/v1/users", headers=_auth_headers(admin_token)).status_code
        == 200
    )
