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


def test_ticket_flow() -> None:
    headers = _auth_headers()

    customer = client.post(
        "/api/v1/customers",
        headers=headers,
        json={
            "company_name": "Test Ticket AS",
            "customer_type": "company",
            "city": "Ankara",
        },
    )
    assert customer.status_code == 201
    customer_id = customer.json()["id"]

    created = client.post(
        "/api/v1/tickets",
        headers=headers,
        json={
            "customer_id": customer_id,
            "subject": "Printer problem",
            "description": "Paper jam",
            "priority": "high",
        },
    )
    assert created.status_code == 201
    ticket = created.json()
    assert ticket["ticket_no"].startswith("TSK-")
    assert ticket["status_code"] == "ticket_open"
    ticket_id = ticket["id"]

    in_progress = client.post(
        "/api/v1/tickets/{}/status".format(ticket_id),
        headers=headers,
        json={"status_code": "ticket_in_progress", "comment": "started"},
    )
    assert in_progress.status_code == 200
    assert in_progress.json()["status_code"] == "ticket_in_progress"

    comment = client.post(
        "/api/v1/tickets/{}/comments".format(ticket_id),
        headers=headers,
        json={"comment": "called customer"},
    )
    assert comment.status_code == 200

    detail = client.get("/api/v1/tickets/{}/detail".format(ticket_id), headers=headers)
    assert detail.status_code == 200
    body = detail.json()
    assert len(body["status_history"]) == 1
    assert any(a["action"] == "comment" for a in body["activities"])

    filtered = client.get(
        "/api/v1/tickets", headers=headers, params={"status_code": "ticket_in_progress"}
    )
    assert filtered.status_code == 200
    assert any(t["id"] == ticket_id for t in filtered.json())

    closed = client.post(
        "/api/v1/tickets/{}/status".format(ticket_id),
        headers=headers,
        json={"status_code": "ticket_closed"},
    )
    assert closed.status_code == 200
    assert closed.json()["closed_at"] is not None


def test_ticket_requires_auth() -> None:
    response = client.get("/api/v1/tickets")
    assert response.status_code == 401


def test_workflow_states_requires_auth() -> None:
    response = client.get("/api/v1/workflow/states")
    assert response.status_code == 401
