from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_customers_requires_auth() -> None:
    response = client.get("/api/v1/customers")
    assert response.status_code == 401
