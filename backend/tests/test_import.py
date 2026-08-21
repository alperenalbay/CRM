import time

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _auth_headers() -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _csv() -> bytes:
    suffix = str(int(time.time() * 1000))
    return (
        "company_name,tax_no,email,city\n"
        f"ImportCo,555{suffix},import@co.com,Istanbul\n"
        f"ImportCo2,556{suffix},import2@co.com,Ankara\n"
    ).encode("utf-8")


def test_import_preview() -> None:
    headers = _auth_headers()
    response = client.post(
        "/api/v1/imports/preview",
        headers=headers,
        files={"file": ("customers.csv", _csv(), "text/csv")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["header_valid"] is True
    assert body["total_rows"] == 2


def test_import_run_and_list() -> None:
    headers = _auth_headers()
    response = client.post(
        "/api/v1/imports",
        headers=headers,
        files={"file": ("customers.csv", _csv(), "text/csv")},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "completed"
    assert body["success_rows"] == 2

    batches = client.get("/api/v1/imports", headers=headers)
    assert batches.status_code == 200
    assert any(b["filename"] == "customers.csv" for b in batches.json())


def test_import_requires_admin() -> None:
    response = client.post(
        "/api/v1/imports",
        files={"file": ("customers.csv", _csv(), "text/csv")},
    )
    assert response.status_code == 401
