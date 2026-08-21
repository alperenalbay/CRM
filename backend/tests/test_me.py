from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _login(username: str, password: str) -> str:
    response = client.post(
        "/api/v1/auth/login", json={"username": username, "password": password}
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def test_update_my_availability() -> None:
    token = _login("admin", "admin123")
    response = client.patch(
        "/api/v1/users/me/status",
        json={"availability": "yemekte"},
        headers=_auth_headers(token),
    )
    assert response.status_code == 200, response.text
    assert response.json()["availability"] == "yemekte"

    me_response = client.get("/api/v1/auth/me", headers=_auth_headers(token))
    assert me_response.status_code == 200
    assert me_response.json()["availability"] == "yemekte"

    restore = client.patch(
        "/api/v1/users/me/status",
        json={"availability": "uygun"},
        headers=_auth_headers(token),
    )
    assert restore.status_code == 200


def test_update_availability_rejects_unknown_value() -> None:
    token = _login("admin", "admin123")
    response = client.patch(
        "/api/v1/users/me/status",
        json={"availability": "bilinmeyen"},
        headers=_auth_headers(token),
    )
    assert response.status_code in (400, 422)


def test_today_activity() -> None:
    token = _login("admin", "admin123")
    response = client.get("/api/v1/users/me/activity", headers=_auth_headers(token))
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["username"] == "admin"
    assert body["availability"] == "uygun"
    assert isinstance(body["items"], list)


def test_change_password_flow() -> None:
    token = _login("admin", "admin123")
    wrong = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "yanlis", "new_password": "YeniSifre123"},
        headers=_auth_headers(token),
    )
    assert wrong.status_code == 400

    ok = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "admin123", "new_password": "YeniSifre123"},
        headers=_auth_headers(token),
    )
    assert ok.status_code == 204

    old_login = client.post(
        "/api/v1/auth/login", json={"username": "admin", "password": "admin123"}
    )
    assert old_login.status_code == 401

    new_token = _login("admin", "YeniSifre123")
    restore = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "YeniSifre123", "new_password": "admin123"},
        headers=_auth_headers(new_token),
    )
    assert restore.status_code == 204
