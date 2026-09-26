"""
Test suite — baseline happy-path tests plus regression tests for D1–D7.
"""

import sys
import os

# Allow importing app from sample-app/ without installing it as a package
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "sample-app"))

import pytest
from app import app, task_service


@pytest.fixture(autouse=True)
def reset_tasks():
    """Reset in-memory task store before each test."""
    task_service._tasks.clear()
    task_service._next_id = 1
    yield


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


# --- Test 1: health endpoint ---
def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200


# --- Test 2: create a valid task ---
def test_create_task(client):
    payload = {"title": "Buy milk", "description": "2% milk", "status": "todo"}
    response = client.post("/tasks", json=payload)
    assert response.status_code == 201
    data = response.get_json()
    assert data["title"] == "Buy milk"


# --- Test 3: list all tasks ---
def test_list_tasks(client):
    client.post("/tasks", json={"title": "Task A", "status": "todo"})
    response = client.get("/tasks")
    assert response.status_code == 200
    tasks = response.get_json()
    assert len(tasks) == 1


# ── D1 regressions ────────────────────────────────────────────────────────────

def test_create_task_missing_title(client):
    """D1 — POST /tasks without a title must be rejected with 400."""
    response = client.post("/tasks", json={"description": "no title here", "status": "todo"})
    assert response.status_code == 400
    assert "error" in response.get_json()


def test_create_task_empty_title(client):
    """D1 — POST /tasks with an empty-string title must be rejected with 400."""
    response = client.post("/tasks", json={"title": "", "status": "todo"})
    assert response.status_code == 400
    assert "error" in response.get_json()


# ── D2 regressions ────────────────────────────────────────────────────────────

def test_get_task_not_found(client):
    """D2 — GET /tasks/<id> for an unknown ID must return 404, not 200/null."""
    response = client.get("/tasks/9999")
    assert response.status_code == 404
    assert "error" in response.get_json()


def test_update_task_not_found(client):
    """D2 — PUT /tasks/<id> for an unknown ID must return 404, not 200/null."""
    response = client.put("/tasks/9999", json={"status": "done"})
    assert response.status_code == 404
    assert "error" in response.get_json()


# ── D3 regressions ────────────────────────────────────────────────────────────

def test_update_status_todo(client):
    """D3 — PUT /tasks/<id> with status='todo' must store and return 'todo'."""
    create_resp = client.post("/tasks", json={"title": "X", "status": "in_progress"})
    task_id = create_resp.get_json()["id"]
    response = client.put(f"/tasks/{task_id}", json={"status": "todo"})
    assert response.status_code == 200
    assert response.get_json()["status"] == "todo"


def test_update_status_done(client):
    """D3 — PUT /tasks/<id> with status='done' must store and return 'done'."""
    create_resp = client.post("/tasks", json={"title": "Y", "status": "todo"})
    task_id = create_resp.get_json()["id"]
    response = client.put(f"/tasks/{task_id}", json={"status": "done"})
    assert response.status_code == 200
    assert response.get_json()["status"] == "done"


# ── D5 regressions ────────────────────────────────────────────────────────────

def test_delete_task_not_found(client):
    """D5 — DELETE /tasks/<id> for an unknown ID must return 404, not crash with 500."""
    response = client.delete("/tasks/9999")
    assert response.status_code == 404
    assert "error" in response.get_json()


# ── D4 regressions (consolidated validators) ──────────────────────────────────

def test_create_task_invalid_status(client):
    """D4/MT-12 — POST /tasks with an invalid status must return 400."""
    response = client.post("/tasks", json={"title": "Task", "status": "flying"})
    assert response.status_code == 400
    assert "error" in response.get_json()


def test_update_status_invalid(client):
    """D4/MT-05 — PUT /tasks/<id> with an invalid status must return 400."""
    create_resp = client.post("/tasks", json={"title": "Task", "status": "todo"})
    task_id = create_resp.get_json()["id"]
    response = client.put(f"/tasks/{task_id}", json={"status": "flying"})
    assert response.status_code == 400
    assert "error" in response.get_json()


# ── D7 — error-path and malformed-request coverage ────────────────────────────

def test_create_task_no_body(client):
    """D7/MT-11 — POST /tasks with no JSON body must return JSON 400, not crash."""
    response = client.post("/tasks", data="not-json", content_type="text/plain")
    assert response.status_code == 400
    body = response.get_json()
    assert body is not None
    assert "error" in body


def test_get_task_exists(client):
    """D7/MT-01 — GET /tasks/<id> for a known ID returns 200 with the task."""
    create_resp = client.post("/tasks", json={"title": "Existing", "status": "todo"})
    task_id = create_resp.get_json()["id"]
    response = client.get(f"/tasks/{task_id}")
    assert response.status_code == 200
    assert response.get_json()["id"] == task_id


def test_get_task_response_shape(client):
    """D7/MT-16 — GET /tasks/<id> response contains id, title, description, status."""
    create_resp = client.post(
        "/tasks", json={"title": "Shape test", "description": "desc", "status": "todo"}
    )
    task_id = create_resp.get_json()["id"]
    body = client.get(f"/tasks/{task_id}").get_json()
    for field in ("id", "title", "description", "status"):
        assert field in body


def test_delete_task_exists(client):
    """D7/MT-07 — DELETE /tasks/<id> for a known ID returns 200."""
    create_resp = client.post("/tasks", json={"title": "To delete", "status": "todo"})
    task_id = create_resp.get_json()["id"]
    response = client.delete(f"/tasks/{task_id}")
    assert response.status_code == 200
    # Task must no longer be present
    assert client.get(f"/tasks/{task_id}").status_code == 404


def test_list_tasks_empty(client):
    """D7/MT-13 — GET /tasks on a fresh store returns 200 with an empty list."""
    response = client.get("/tasks")
    assert response.status_code == 200
    assert response.get_json() == []


def test_method_not_allowed(client):
    """D7/MT-15 — Unsupported method returns JSON 405, not an HTML page."""
    response = client.patch("/tasks/1")
    assert response.status_code == 405
    body = response.get_json()
    assert body is not None
    assert "error" in body
