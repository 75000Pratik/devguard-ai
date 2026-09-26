# DevGuard AI — Engineering Risk Report

**Agent:** Risk Agent  
**Date:** 2026-09-26  
**Status:** Baseline inspection — no code modified  
**Baseline test run:** 3 tests collected, 3 passed, 0 failed

---

## Scope

Files inspected:

| File | Lines |
|------|-------|
| `sample-app/app.py` | 79 |
| `sample-app/services/task_service.py` | 40 |
| `sample-app/utils/validators.py` | 13 |
| `tests/test_app.py` | 61 |
| `sample-app/README.md` | 21 |
| `sample-app/requirements.txt` | 2 |

Cross-referenced against:
- `docs/baseline-defect-matrix.md`
- `results/architecture-report.md`

---

## Findings

### RISK-01 — Deterministic Status-Update Logic Bug

| Field | Value |
|-------|-------|
| **Issue ID** | RISK-01 |
| **Severity** | **Critical** |
| **Type** | Confirmed defect — direct code evidence |
| **Affected file** | `sample-app/services/task_service.py` line 34 |
| **Defect ref** | D3 |

**Evidence**

```python
# task_service.py, line 34
task["status"] = "in_progress"   # always, ignoring the `status` argument
```

`TaskService.update_status(task_id, status)` receives a `status` parameter but never
uses it. Every `PUT /tasks/<id>` call writes the hard-coded string `"in_progress"` to
the task regardless of what the caller requested. Requests for `"todo"` or `"done"` are
silently discarded.

**Developer/user impact**

- The entire status-update feature is functionally broken.
- Users who transition a task to `"done"` will see `"in_progress"` returned — with no
  error, no warning.
- No existing test exercises `PUT`, so the bug is invisible in CI.
- Severity is elevated to **Critical** because the feature is silently wrong rather than
  visibly failing.

**Recommended fix**

```python
task["status"] = status   # use the passed argument
```

---

### RISK-02 — Missing-Task Returns HTTP 200 With `null` Body (GET and PUT)

| Field | Value |
|-------|-------|
| **Issue ID** | RISK-02 |
| **Severity** | **High** |
| **Type** | Confirmed defect — direct code evidence |
| **Affected files** | `sample-app/app.py` lines 23–25, 64–66; `sample-app/services/task_service.py` lines 12–13, 28–30 |
| **Defect ref** | D2 |

**Evidence**

```python
# app.py, line 23–25
def get_task(task_id):
    task = task_service.get_by_id(task_id)
    return jsonify(task), 200          # serializes None as JSON null + 200

# task_service.py, line 12–13
def get_by_id(self, task_id):
    return self._tasks.get(task_id)    # returns None for unknown ID

# app.py, line 64–66
    task = task_service.update_status(task_id, status)
    return jsonify(task), 200          # same problem on PUT

# task_service.py, line 28–30
    if task is None:
        return None                    # silent None instead of raising
```

`GET /tasks/999` (non-existent ID) returns `HTTP 200` with body `null`.
`PUT /tasks/999` returns `HTTP 200` with body `null`.
Neither route checks the return value before serialising it.

**Developer/user impact**

- API clients cannot distinguish "task exists with null value" from "task does not
  exist" using the status code alone.
- RESTful contract is violated: `GET /resource/<missing>` MUST return 404.
- Client-side code that checks `if (data)` instead of the status code will silently
  treat missing resources as found.

**Recommended fix**

In both route handlers, add a guard:
```python
if task is None:
    return jsonify({"error": "Task not found"}), 404
```

---

### RISK-03 — Unguarded `del` Raises `KeyError` and Returns HTTP 500 on Delete of Missing Task

| Field | Value |
|-------|-------|
| **Issue ID** | RISK-03 |
| **Severity** | **High** |
| **Type** | Confirmed defect — direct code evidence |
| **Affected files** | `sample-app/services/task_service.py` line 39; `sample-app/app.py` lines 69–73 |
| **Defect ref** | D5 |

**Evidence**

```python
# task_service.py, line 39
def delete(self, task_id):
    del self._tasks[task_id]   # KeyError if task_id not present

# app.py, lines 69–73
def delete_task(task_id):
    task_service.delete(task_id)   # no try/except
    return jsonify({"deleted": task_id}), 200
```

No `@app.errorhandler` is registered. Flask catches the unhandled `KeyError` and returns
an HTML 500 response (or a full Werkzeug interactive traceback in debug mode).

**Developer/user impact**

- `DELETE /tasks/999` returns an unformatted HTML 500 error page, not JSON.
- In debug mode (currently the default — see RISK-06) the Werkzeug debugger exposes a
  full Python stack trace to the caller.
- Breaks the application's JSON contract on every error path of the delete endpoint.

**Recommended fix**

```python
# task_service.py
def delete(self, task_id):
    if task_id not in self._tasks:
        return False
    del self._tasks[task_id]
    return True
```
```python
# app.py
def delete_task(task_id):
    deleted = task_service.delete(task_id)
    if not deleted:
        return jsonify({"error": "Task not found"}), 404
    return jsonify({"deleted": task_id}), 200
```

---

### RISK-04 — Missing `title` Validation Allows Blank Tasks

| Field | Value |
|-------|-------|
| **Issue ID** | RISK-04 |
| **Severity** | **High** |
| **Type** | Confirmed defect — direct code evidence |
| **Affected file** | `sample-app/app.py` lines 36–48 |
| **Defect ref** | D1 |

**Evidence**

```python
# app.py, lines 36–48
description = data.get("description", "")
status = data.get("status", "todo")

if status not in ("todo", "in_progress", "done"):
    return jsonify({"error": "Invalid status"}), 400

task = task_service.create(
    title=data.get("title", ""),   # empty string silently accepted
    ...
)
return jsonify(task), 201
```

`title` is never checked for presence or non-emptiness before `task_service.create()` is
called. A `POST /tasks` with `{}` or `{"title": ""}` creates a persisted task with a
blank title.

**Developer/user impact**

- Data integrity is violated at ingestion point.
- Downstream consumers listing tasks receive records with empty `"title": ""` fields.
- No HTTP 400 is returned; the client receives 201 Created — an actively misleading
  success response.

**Recommended fix**

```python
title = data.get("title", "").strip()
if not title:
    return jsonify({"error": "title is required"}), 400
```

---

### RISK-05 — Hard-Coded `debug=True` — Security and Configuration Risk

| Field | Value |
|-------|-------|
| **Issue ID** | RISK-05 |
| **Severity** | **High** |
| **Type** | Confirmed defect — direct code evidence |
| **Affected file** | `sample-app/app.py` lines 5, 78 |
| **Defect ref** | D6 |

**Evidence**

```python
# app.py, line 5
app.config["DEBUG"] = True   # hard-coded

# app.py, line 78
app.run(debug=True, host="0.0.0.0", port=5000)   # hard-coded again
```

Debug mode is set in **two** places with no environment-variable check. There is no
`FLASK_ENV`, no config class, and no runtime override path.

**Developer/user impact**

- If this application is deployed (even accidentally), the Werkzeug interactive
  debugger is reachable by any network client — it allows arbitrary Python code
  execution via the PIN-protected console. Even with PIN protection, exposing the
  debugger endpoint is a critical operational risk.
- Stack traces are served as HTML to callers on every unhandled exception.
- Combined with RISK-03, a DELETE to a missing task will return a full interactive
  traceback to the client.

**Recommended fix**

```python
import os
# app.py, line 5
app.config["DEBUG"] = os.getenv("FLASK_DEBUG", "false").lower() == "true"

# app.py, line 78
app.run(host="0.0.0.0", port=5000)   # let Flask read FLASK_DEBUG from env
```

---

### RISK-06 — No Global Error Handler — HTML Errors on a JSON API

| Field | Value |
|-------|-------|
| **Issue ID** | RISK-06 |
| **Severity** | **Medium** |
| **Type** | Confirmed defect — direct code evidence |
| **Affected file** | `sample-app/app.py` (entire file) |

**Evidence**

No `@app.errorhandler` decorator appears anywhere in `app.py`. Flask's default error
handlers return HTML pages for 404, 405, and 500 responses.

Examples of paths that currently return HTML:
- Any request to an undefined URL → HTML 404
- `DELETE /tasks/999` → HTML 500 (KeyError — see RISK-03)
- Method-not-allowed (e.g. `PATCH /tasks/1`) → HTML 405

**Developer/user impact**

- API clients that parse `response.json()` unconditionally will throw a parse error on
  every Flask-generated error response.
- Inconsistency: success responses are JSON; all error responses are HTML.
- The contract implied by `Content-Type: application/json` is broken on error paths.

**Recommended fix**

Register JSON error handlers:

```python
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500
```

---

### RISK-07 — Duplicated Status Validation — Dead `validators.py` Module

| Field | Value |
|-------|-------|
| **Issue ID** | RISK-07 |
| **Severity** | **Medium** |
| **Type** | Confirmed defect — direct code evidence |
| **Affected files** | `sample-app/app.py` lines 41–42, 61–62; `sample-app/utils/validators.py` (entire file) |
| **Defect ref** | D4 |

**Evidence**

```python
# app.py, line 41–42 (POST handler)
if status not in ("todo", "in_progress", "done"):
    return jsonify({"error": "Invalid status"}), 400

# app.py, line 61–62 (PUT handler)
if status not in ("todo", "in_progress", "done"):
    return jsonify({"error": "Invalid status"}), 400
```

The identical tuple `("todo", "in_progress", "done")` is repeated verbatim in two
separate route handlers. `validators.py` already defines:

```python
ALLOWED_STATUSES = ("todo", "in_progress", "done")

def is_valid_status(status):
    return status in ALLOWED_STATUSES
```

…but is **never imported** by `app.py` or any other module.

**Developer/user impact**

- Adding a new allowed status (e.g. `"archived"`) requires editing three locations:
  the POST handler, the PUT handler, and `validators.py`.
- Divergence between the three copies is certain over time — one copy will be missed.
- `validators.py` is dead code; it consumes developer attention during review with no
  runtime benefit.

**Recommended fix**

Import `is_valid_status` from `validators.py` in `app.py` and replace both inline
checks with the shared function.

---

### RISK-08 — Insufficient Test Coverage — 3 Happy-Path Tests Only

| Field | Value |
|-------|-------|
| **Issue ID** | RISK-08 |
| **Severity** | **High** |
| **Type** | Confirmed gap — direct code evidence |
| **Affected file** | `tests/test_app.py` (entire file) |
| **Defect ref** | D7 |

**Evidence**

The test file itself documents the gaps:

```python
"""
Baseline test suite — D7: only 3 basic happy-path tests.

Missing tests (intentional gaps):
- POST /tasks with missing title
- POST /tasks with malformed JSON
- GET /tasks/<id> for nonexistent task
- PUT /tasks/<id> with invalid status
- DELETE /tasks/<id>
- Regression test for D3 status-update bug
- Error response shape consistency
"""
```

Measured coverage of error-producing paths:

| Endpoint | Happy path tested | Error path tested |
|----------|:-----------------:|:-----------------:|
| GET /health | ✅ | — |
| GET /tasks | ✅ | — |
| GET /tasks/\<id\> | ❌ | ❌ |
| POST /tasks | ✅ | ❌ |
| PUT /tasks/\<id\> | ❌ | ❌ |
| DELETE /tasks/\<id\> | ❌ | ❌ |

RISK-01 (the deterministic D3 bug) is entirely invisible in CI because no test
exercises `PUT /tasks/<id>`.

**Developer/user impact**

- 5 of 8 known defects have zero automated test coverage.
- Any future regression in the tested endpoints will also be undetected if it touches
  untested code paths.
- CI passes despite a completely broken feature (PUT status update).

**Recommended fix**

Add tests for:
1. `POST /tasks` with missing `title` → expect 400
2. `POST /tasks` with no JSON body → expect 400
3. `GET /tasks/<id>` for non-existent ID → expect 404
4. `PUT /tasks/<id>` with valid status → expect 200 and correct status returned (D3 regression)
5. `PUT /tasks/<id>` with invalid status → expect 400
6. `PUT /tasks/<id>` for non-existent ID → expect 404
7. `DELETE /tasks/<id>` for existing task → expect 200
8. `DELETE /tasks/<id>` for non-existent ID → expect 404

---

### RISK-09 — Incomplete README — Missing Endpoint Contract and Usage Instructions

| Field | Value |
|-------|-------|
| **Issue ID** | RISK-09 |
| **Severity** | **Medium** |
| **Type** | Confirmed gap — direct code evidence |
| **Affected file** | `sample-app/README.md` |
| **Defect ref** | D8 |

**Evidence**

Current README content (21 lines total):
- Lists endpoint paths only — no HTTP methods, no request body schema, no response shape
- No `pip install` environment instructions (virtualenv, Python version)
- No example `curl` commands
- No testing instructions (`pytest` command, working directory, path setup)
- A HTML comment inside the file acknowledges the gaps: `<!-- D8: Missing installation steps, request/response examples, and testing instructions -->`

**Developer/user impact**

- A new developer cannot run the application or the tests from the README alone.
- No documented contract for API consumers (required fields, allowed values,
  error shapes).
- The `POST /tasks` required field (`title`) is not documented anywhere user-facing.

**Recommended fix**

Expand README to include:
- Python version and virtualenv setup
- `pip install` and `python app.py` with expected output
- Request/response examples for all 6 endpoints
- `pytest` instructions with the correct working directory
- Allowed status values and error response format

---

### RISK-10 — Test State Reset Accesses Private Implementation Attributes

| Field | Value |
|-------|-------|
| **Issue ID** | RISK-10 |
| **Severity** | **Low** |
| **Type** | Design concern — not an immediate functional bug |
| **Affected file** | `tests/test_app.py` lines 27–28 |

**Evidence**

```python
@pytest.fixture(autouse=True)
def reset_tasks():
    task_service._tasks.clear()      # private attribute
    task_service._next_id = 1        # private attribute
    yield
```

The fixture directly reads and writes `TaskService._tasks` and `TaskService._next_id`
— attributes that are name-prefixed with `_` to signal implementation-private status.

**Developer/user impact**

- Renaming `_tasks` to `_store` or `_next_id` to `_counter` will silently break the
  test fixture without any type-checker or linter warning.
- Tests are coupled to internal `TaskService` structure rather than its public API.

**Recommended fix**

Add a public `reset()` method (or `clear()`) to `TaskService` and call that from the
fixture instead. Alternatively, instantiate a new `TaskService` per test.

---

### RISK-11 — `pytest` Listed as Production Dependency

| Field | Value |
|-------|-------|
| **Issue ID** | RISK-11 |
| **Severity** | **Low** |
| **Type** | Design concern — not an immediate functional bug |
| **Affected file** | `sample-app/requirements.txt` |

**Evidence**

```
flask==3.0.3
pytest==8.2.2
```

Both runtime (`flask`) and development/test (`pytest`) dependencies are in a single
`requirements.txt` file with no separation.

**Developer/user impact**

- Any deployment tooling that installs `requirements.txt` will install `pytest` into
  production containers, adding unnecessary size and a test-tool attack surface.
- No `requirements-dev.txt` or `pyproject.toml` `[dev]` extras exist.

**Recommended fix**

Split into `requirements.txt` (Flask only) and `requirements-dev.txt` (pytest), or use
`pyproject.toml` with optional `[dev]` extras.

---

### RISK-12 — In-Memory Storage Is Not Thread-Safe

| Field | Value |
|-------|-------|
| **Issue ID** | RISK-12 |
| **Severity** | **Low** |
| **Type** | Design concern — known architectural limitation |
| **Affected file** | `sample-app/services/task_service.py` lines 4–6, 22–23 |

**Evidence**

```python
def __init__(self):
    self._tasks = {}       # shared dict
    self._next_id = 1      # shared counter

def create(self, title, description, status):
    ...
    self._tasks[self._next_id] = task
    self._next_id += 1     # read-modify-write — not atomic under threads
```

`_next_id` increment is a three-operation sequence (read, add, store). Under a
multi-threaded WSGI server (e.g. `gunicorn --workers 2 --threads 2`), two concurrent
`POST /tasks` requests can receive the same ID and one task will silently overwrite
the other.

**Developer/user impact**

- For the current single-process `python app.py` startup, this is safe.
- Risk is latent — it activates if the app is placed behind a threaded server.

**Recommended fix**

Documented limitation acceptable for this demo scope. If concurrency becomes a
concern: use `threading.Lock` around ID increment and dict writes, or replace the
in-memory store with a real database.

---

## Summary

### Issues by Severity

| Severity | Count | Issue IDs |
|----------|------:|-----------|
| Critical | 1 | RISK-01 |
| High | 4 | RISK-02, RISK-03, RISK-04, RISK-05 |
| Medium | 3 | RISK-06, RISK-07, RISK-09 |
| Low | 4 | RISK-08 (elevated from Medium due to CI impact), RISK-10, RISK-11, RISK-12 |
| **Total** | **12** | |

> Note: RISK-08 (test coverage) is classified **High** because it renders RISK-01 (Critical)
> invisible in CI — it is a force-multiplier for existing defects, not merely a quality metric.

Revised severity table with RISK-08 corrected:

| Severity | Count | Issue IDs |
|----------|------:|-----------|
| Critical | 1 | RISK-01 |
| High | 5 | RISK-02, RISK-03, RISK-04, RISK-05, RISK-08 |
| Medium | 3 | RISK-06, RISK-07, RISK-09 |
| Low | 3 | RISK-10, RISK-11, RISK-12 |
| **Total** | **12** | |

---

### Top 3 Repair Priorities

#### Priority 1 — RISK-01: Fix the deterministic `update_status` bug (D3)

**Why first:** The status-update feature is completely non-functional. Every `PUT`
request overwrites any status with `"in_progress"`. This is a single-line fix
(`task["status"] = status`) with zero risk of regression. Fixing it also unblocks
meaningful test authoring for the PUT endpoint.

**File:** `sample-app/services/task_service.py` line 34

---

#### Priority 2 — RISK-02 + RISK-03 + RISK-04: Add missing-resource 404s and title validation

**Why second:** These three defects share the same fix pattern — add guard clauses in
route handlers before returning a response. They collectively represent the entire
error-path contract of the API. Fixing them in a single pass makes the HTTP behaviour
correct and consistent.

**Files:** `sample-app/app.py` (all route handlers), `sample-app/services/task_service.py`

---

#### Priority 3 — RISK-08: Expand test coverage to cover all 8 known defects

**Why third:** Until tests exercise the PUT endpoint, DELETE with missing ID, GET with
missing ID, and POST without title, CI cannot detect regressions for any of the above
fixes. Writing tests immediately after fixing ensures the fixes are locked in and any
future regression is caught automatically.

**File:** `tests/test_app.py`

---

### Files Requiring Repair

| Priority | File | Issues |
|----------|------|--------|
| 🔴 Immediate | `sample-app/services/task_service.py` | RISK-01, RISK-02, RISK-03 |
| 🔴 Immediate | `sample-app/app.py` | RISK-02, RISK-03, RISK-04, RISK-05, RISK-06, RISK-07 |
| 🟡 Follow-on | `tests/test_app.py` | RISK-08 |
| 🟡 Follow-on | `sample-app/utils/validators.py` | RISK-07 (wire in or remove) |
| 🟢 Low effort | `sample-app/README.md` | RISK-09 |
| 🟢 Low effort | `sample-app/requirements.txt` | RISK-11 |

---

### Risks Acceptable as Documented Limitations

The following issues are **not recommended for immediate repair** and may remain as
documented limitations of this demo-scope application:

| Issue | Reason acceptable |
|-------|-------------------|
| RISK-10 — Test state uses private attributes | Low coupling risk in a small, stable codebase; no production impact |
| RISK-11 — pytest in requirements.txt | No production deployment exists; affects packaging hygiene only |
| RISK-12 — In-memory storage not thread-safe | Application runs single-process; risk is latent and documented |

---

_Report generated by DevGuard AI Risk Agent. No production code was modified._
