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


def _customer() -> int:
    headers = _auth_headers()
    response = client.post(
        "/api/v1/customers",
        headers=headers,
        json={"company_name": "Phase3 AS", "customer_type": "company"},
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_task_flow() -> None:
    headers = _auth_headers()
    created = client.post(
        "/api/v1/tasks",
        headers=headers,
        json={"title": "Prepare report", "priority": "medium", "assigned_to_id": 1},
    )
    assert created.status_code == 201
    task = created.json()
    assert task["status_code"] == "task_todo"
    task_id = task["id"]

    in_progress = client.post(
        "/api/v1/tasks/{}/status".format(task_id),
        headers=headers,
        json={"status_code": "task_in_progress"},
    )
    assert in_progress.status_code == 200
    assert in_progress.json()["status_code"] == "task_in_progress"

    detail = client.get("/api/v1/tasks/{}/detail".format(task_id), headers=headers)
    assert detail.status_code == 200
    assert len(detail.json()["assignments"]) >= 1

    filtered = client.get(
        "/api/v1/tasks", headers=headers, params={"status_code": "task_in_progress"}
    )
    assert any(t["id"] == task_id for t in filtered.json())


def test_sales_order_flow() -> None:
    headers = _auth_headers()
    customer_id = _customer()

    products = client.get("/api/v1/products", headers=headers)
    assert products.status_code == 200
    product_a = products.json()[0]
    product_b = products.json()[1]

    created = client.post(
        "/api/v1/orders",
        headers=headers,
        json={
            "customer_id": customer_id,
            "status": "confirmed",
            "items": [
                {"product_id": product_a["id"], "quantity": 2},
                {"product_id": product_b["id"], "quantity": 1},
            ],
        },
    )
    assert created.status_code == 201
    order = created.json()
    assert order["order_no"].startswith("SO-")
    assert len(order["items"]) == 2
    expected = round(2 * product_a["unit_price"] + product_b["unit_price"], 2)
    assert order["total_amount"] == expected

    fetched = client.get("/api/v1/orders/{}/".format(order["id"]), headers=headers)
    assert fetched.status_code == 200


def test_dashboard_summary() -> None:
    headers = _auth_headers()
    response = client.get("/api/v1/dashboard/summary", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert "customer_count" in body
    assert "open_ticket_count" in body
    assert "open_task_count" in body
    assert "sales_total" in body
    assert "recent_tickets" in body
