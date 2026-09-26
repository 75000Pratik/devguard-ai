# Task Manager API

A deliberately simple Flask REST API for managing tasks. The repository is used as a
controlled engineering demonstration for the **DevGuard AI** workflow — it ships with
known defects, agent-generated reports, and a test suite that was expanded to expose
those defects.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Dependencies](#dependencies)
3. [Installation](#installation)
4. [Environment Configuration](#environment-configuration)
5. [Running the Application](#running-the-application)
6. [API Endpoints](#api-endpoints)
7. [Request and Response Examples](#request-and-response-examples)
8. [Error Behavior](#error-behavior)
9. [Running the Tests](#running-the-tests)
10. [Known Limitations](#known-limitations)
11. [Data and Storage Behavior](#data-and-storage-behavior)

---

## Architecture Overview

```
HTTP Client
    │
    ▼
Flask router  (sample-app/app.py)
    │  URL dispatch → handler function
    │  request.get_json() for body parsing
    │  Global JSON error handlers for 400, 404, 405
    │
    ├── sample-app/services/task_service.py
    │       In-memory CRUD over a plain Python dict.
    │       Owns the _tasks dict and the _next_id counter.
    │
    └── sample-app/utils/validators.py
            ALLOWED_STATUSES constant and two shared helpers:
            is_valid_status()  — used by the PUT route
            validate_task_payload() — used by the POST route
```

| Layer | File | Responsibility |
|-------|------|----------------|
| HTTP routing | `sample-app/app.py` | Flask app, routes, error handlers, startup |
| Business logic | `sample-app/services/task_service.py` | In-memory CRUD, ID assignment |
| Validation | `sample-app/utils/validators.py` | Shared status and payload validation |
| Dependencies | `sample-app/requirements.txt` | Pinned Python packages |
| Tests | `tests/test_app.py` | pytest suite (19 tests) |

There is no database, no ORM, no authentication, and no middleware. All state lives in a
single `TaskService` instance created at module load time.

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `flask` | 3.0.3 | Web framework and HTTP server |
| `pytest` | 8.2.2 | Test runner (listed in `requirements.txt`) |

Python 3.8 or newer is required (no version is pinned in `requirements.txt`).

---

## Installation

```bash
# 1. Clone or download the repository
cd sample-app

# 2. (Optional but recommended) create and activate a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
```

---

## Environment Configuration

| Variable | Default | Effect |
|----------|---------|--------|
| `FLASK_DEBUG` | `"0"` | Set to `"1"`, `"true"`, or `"yes"` to enable Flask debug mode. Any other value (or absent) keeps debug mode **off**. |

**Important:** When `FLASK_DEBUG` is enabled, Flask's interactive Werkzeug debugger is
active. This exposes stack traces over HTTP to any caller. Never enable it in a
production or publicly reachable environment.

```bash
# Disable debug mode (default — safe for production-like runs)
python app.py

# Enable debug mode (development only)
FLASK_DEBUG=1 python app.py        # macOS / Linux
$env:FLASK_DEBUG="1"; python app.py  # Windows PowerShell
```

---

## Running the Application

Run from the `sample-app/` directory:

```bash
cd sample-app
python app.py
```

The server starts on `http://0.0.0.0:5000`. With the default configuration, debug mode
is **off**. The application is reachable at `http://localhost:5000`.

---

## API Endpoints

All successful responses use `Content-Type: application/json`.  
All error responses also use `Content-Type: application/json` (not HTML).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check — returns `{"status": "ok"}` |
| `GET` | `/tasks` | List all tasks (empty array when none exist) |
| `GET` | `/tasks/<id>` | Fetch a single task by integer ID |
| `POST` | `/tasks` | Create a new task |
| `PUT` | `/tasks/<id>` | Update the status of an existing task |
| `DELETE` | `/tasks/<id>` | Delete an existing task |

### Allowed task statuses

The only valid values for the `status` field are:

- `"todo"`
- `"in_progress"`
- `"done"`

Any other value is rejected with HTTP 400.

---

## Request and Response Examples

### GET /health

```http
GET /health HTTP/1.1
```

```json
200 OK
{"status": "ok"}
```

---

### GET /tasks — list all tasks

```http
GET /tasks HTTP/1.1
```

```json
200 OK
[
  {"id": 1, "title": "Buy milk", "description": "2% milk", "status": "todo"},
  {"id": 2, "title": "Write tests", "description": "", "status": "in_progress"}
]
```

Returns `[]` when no tasks exist.

---

### GET /tasks/\<id\> — fetch one task

```http
GET /tasks/1 HTTP/1.1
```

```json
200 OK
{"id": 1, "title": "Buy milk", "description": "2% milk", "status": "todo"}
```

---

### POST /tasks — create a task

`title` is **required** and must be a non-empty string.  
`description` is optional (defaults to `""`).  
`status` is optional (defaults to `"todo"`); must be one of the allowed values if provided.

```http
POST /tasks HTTP/1.1
Content-Type: application/json

{"title": "Buy milk", "description": "2% milk", "status": "todo"}
```

```json
201 Created
{"id": 1, "title": "Buy milk", "description": "2% milk", "status": "todo"}
```

Minimal request (only `title` required):

```http
POST /tasks HTTP/1.1
Content-Type: application/json

{"title": "Write tests"}
```

```json
201 Created
{"id": 2, "title": "Write tests", "description": "", "status": "todo"}
```

---

### PUT /tasks/\<id\> — update task status

Only the `status` field is accepted. Providing a different field does not update anything
else on the task.

```http
PUT /tasks/1 HTTP/1.1
Content-Type: application/json

{"status": "in_progress"}
```

```json
200 OK
{"id": 1, "title": "Buy milk", "description": "2% milk", "status": "in_progress"}
```

---

### DELETE /tasks/\<id\> — delete a task

```http
DELETE /tasks/1 HTTP/1.1
```

```json
200 OK
{"deleted": 1}
```

---

## Error Behavior

All error responses return a JSON object with an `"error"` key. HTML error pages are
never returned by any route.

| Situation | HTTP Status | Example response body |
|-----------|:-----------:|----------------------|
| Request body is missing or not valid JSON | `400` | `{"error": "No data provided"}` |
| `title` is absent or empty on POST | `400` | `{"error": "title is required"}` |
| `status` is not an allowed value | `400` | `{"error": "Invalid status"}` |
| PUT body contains no data | `400` | `{"error": "No data provided"}` |
| Task ID does not exist (GET, PUT, DELETE) | `404` | `{"error": "Task not found"}` |
| Unregistered route | `404` | `{"error": "Not found"}` |
| Unsupported HTTP method on a known route | `405` | `{"error": "Method not allowed"}` |

---

## Running the Tests

Tests are in `tests/test_app.py` and run from the **repository root** (not from inside
`sample-app/`):

```bash
# From the repository root
pytest tests/test_app.py -v
```

The test file uses `sys.path` manipulation to import `app` directly from `sample-app/`
without requiring a package install.

### Current test count: 18

| Category | Tests | Covers |
|----------|------:|--------|
| Health | 1 | `GET /health` availability |
| List tasks | 2 | Happy path, empty-store edge case |
| Create task | 5 | Valid creation, missing title, empty title, no body, invalid status |
| Fetch single task | 3 | Happy path, 404, response shape |
| Update task status | 4 | `todo` regression, `done` regression, invalid status, 404 |
| Delete task | 2 | Happy path, 404 (formerly crashed with 500) |
| Error contract | 1 | Method-not-allowed (405) |
| **Total** | **18** | All 6 endpoints, all 7 repaired defects |

All 18 tests pass against the current codebase.

Each test resets the in-memory store via the `reset_tasks` autouse fixture before
running, so tests are fully independent of each other.

---

## Known Limitations

| # | Limitation | Detail |
|---|-----------|--------|
| L1 | **In-memory storage only** | All task data is lost when the process restarts. There is no database, file persistence, or cache. |
| L2 | **Not thread-safe** | The `TaskService` singleton and its `_next_id` counter are shared across requests with no locking. Running under a multi-threaded WSGI server (e.g. gunicorn with workers) can cause ID collisions or lost writes. |
| L3 | **No authentication or authorisation** | Any caller can read, create, modify, or delete any task. |
| L4 | **Status is the only updatable field** | `PUT /tasks/<id>` accepts only `status`. There is no endpoint to change `title` or `description` after creation. |
| L5 | **Integer IDs only** | Task IDs are assigned sequentially starting from 1 and are never reused after deletion. |
| L6 | **No pagination** | `GET /tasks` returns all tasks in a single response regardless of count. |
| L7 | **pytest listed as a runtime dependency** | `pytest` appears in `requirements.txt` alongside `flask` with no dev-dependency separation. |
| L8 | **Test isolation accesses private attributes** | The `reset_tasks` fixture resets `task_service._tasks` and `task_service._next_id` directly. Any rename of those private attributes will silently break all tests. |

---

## Data and Storage Behavior

- **All data is stored in a Python `dict` in process memory.** There is no database, no
  file, and no external cache.
- **Data resets to empty every time the application restarts.** Starting `app.py` always
  begins with zero tasks and the ID counter at 1.
- **IDs are sequential integers** assigned by a simple counter (`_next_id`). After a task
  is deleted its former ID is never reassigned.
- **The task object shape** returned by every endpoint is:

  ```json
  {
    "id": 1,
    "title": "string",
    "description": "string",
    "status": "todo | in_progress | done"
  }
  ```

- **Concurrent access is not safe.** If two requests arrive simultaneously and both
  attempt to create a task, the `_next_id` counter may be read and incremented by both
  before either write completes, potentially producing duplicate IDs or lost tasks under
  a threaded server.
