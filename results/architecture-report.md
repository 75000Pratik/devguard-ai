# DevGuard AI — Architecture Report

**Agent:** Architecture Agent  
**Date:** 2026-09-26  
**Status:** Baseline inspection — no code modified

---

## 1. Repository Summary

| Property                  | Value                               |
| ------------------------- | ----------------------------------- |
| Application type          | Flask REST API (Python)             |
| Framework                 | Flask 3.0.3                         |
| Storage                   | In-memory Python dict (no database) |
| Entry point               | `sample-app/app.py`                 |
| Test runner               | pytest 8.2.2                        |
| Known intentional defects | 8 (D1–D8)                           |

The repository is a deliberately imperfect task-management API intended for a controlled engineering improvement demonstration.

---

## 2. File Map and Responsibilities

| File                                  | Responsibility                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `sample-app/app.py`                   | Flask application factory, route definitions, HTTP request/response handling, application startup   |
| `sample-app/services/task_service.py` | In-memory task CRUD — create, read, update, delete; owns `_tasks` dict and `_next_id` counter       |
| `sample-app/utils/validators.py`      | Defines `ALLOWED_STATUSES` and `is_valid_status()` — **declared but never imported or called**      |
| `sample-app/requirements.txt`         | Python dependency pinning (flask, pytest)                                                           |
| `sample-app/README.md`                | Minimal developer documentation (intentionally incomplete — D8)                                     |
| `tests/test_app.py`                   | Pytest test suite; 3 happy-path tests only (intentionally thin — D7)                                |
| `docs/baseline-app-plan.md`           | Human-readable spec describing modules, endpoints, and planned defects                              |
| `docs/sample-app-spec.md`             | Higher-level specification and acceptance criteria for the sample application                       |
| `docs/baseline-defect-matrix.md`      | Defect catalogue with severity ratings and expected repair outcomes                                 |
| `bob-prompts/*.md`                    | Agent prompt files for the DevGuard AI workflow (Architecture, Risk, Fix, Test, Docs, Verification) |
| `results/`                            | Output directory for agent-generated reports                                                        |

---

## 3. Request and Data Flow

```
HTTP Client
    │
    ▼
Flask router (app.py)
    │  - URL dispatch to handler function
    │  - request.get_json() for body parsing
    │
    ├── GET  /health          → returns {"status": "ok"}, 200
    │
    ├── GET  /tasks           → task_service.get_all()
    │                              → returns list(_tasks.values())
    │
    ├── GET  /tasks/<id>      → task_service.get_by_id(id)
    │                              → _tasks.get(id)  [returns None if missing — D2]
    │
    ├── POST /tasks           → inline body validation (D1: title not checked; D4: status check duplicated)
    │                         → task_service.create(title, description, status)
    │                              → assigns _next_id, inserts into _tasks dict
    │
    ├── PUT  /tasks/<id>      → inline body validation (D4: duplicated status check)
    │                         → task_service.update_status(id, status)
    │                              → always sets status="in_progress" regardless of input  [D3]
    │                              → returns None silently if task missing  [D2]
    │
    └── DELETE /tasks/<id>    → task_service.delete(id)
                                   → del _tasks[id]  [KeyError propagates if missing — D5]

No middleware, no error handlers (@app.errorhandler), no authentication.
validators.py is never invoked — dead module.
```

---

## 4. Dependency Overview

```
app.py
  └── imports TaskService from services/task_service.py

task_service.py
  └── no imports (pure Python)

validators.py
  └── no imports — and is NOT imported by anything
      (dead code relative to the running application)

tests/test_app.py
  └── imports app, task_service from sample-app/app.py
      uses sys.path manipulation to locate the package
```

**External runtime dependency:** Flask 3.0.3 only.  
**No ORM, no database driver, no config library, no logging framework.**

---

## 5. Architecture Weaknesses

### W1 — Flat monolithic route file (app.py)

`app.py` combines Flask app factory, route declarations, request parsing, business-logic calls, and the `if __name__ == "__main__"` startup block in a single ~80-line file. There is no blueprint separation, no application factory function, and no configuration object. All routes share the same `task_service` singleton bound at module import time.

**Risk:** Any growth in endpoint count makes the file harder to test and maintain.

---

### W2 — Dead utility module (validators.py)

`validators.py` defines `is_valid_status()` and `ALLOWED_STATUSES`, but nothing imports or calls it. The same status check (`status not in ("todo", "in_progress", "done")`) is duplicated verbatim in two route handlers in `app.py` (POST and PUT).

**Risk:** D4 — when the allowed-status list changes, developers must update three locations; divergence is certain.

---

### W3 — Service layer returns None for missing resources (D2)

`TaskService.get_by_id()` and `TaskService.update_status()` return `None` when a task does not exist rather than raising an exception. The callers in `app.py` do not check the return value before serialising it; the client receives `null` with HTTP 200 instead of a structured 404.

**Risk:** Clients cannot distinguish "task exists and is null" from "task does not exist". This is a correctness defect surfaceable in production.

---

### W4 — Deterministic logic bug in update_status (D3)

Line 34 of `task_service.py`:

```python
task["status"] = "in_progress"   # always, ignoring the `status` argument
```

Every PUT request writes `"in_progress"` regardless of the caller's intent. No test currently catches this because no PUT test exists.

**Risk:** The entire update-status feature is silently broken.

---

### W5 — Unguarded `del` in delete() causes 500 on missing task (D5)

`TaskService.delete()` uses `del self._tasks[task_id]`, which raises `KeyError` when the ID does not exist. `app.py`'s `delete_task` route has no try/except and no `@app.errorhandler`. Flask will return an unformatted 500 response in production mode and an HTML debug traceback in debug mode.

**Risk:** Unanticipated exceptions are completely unhandled — client-visible 500 errors with stack traces.

---

### W6 — Debug mode hard-coded in source (D6)

`app.config["DEBUG"] = True` is set unconditionally at line 5, and `app.run(debug=True, ...)` is set again at line 78. There is no environment-variable check, no config file, and no `FLASK_ENV` override path.

**Risk:** If this code were deployed, debug mode would expose interactive tracebacks (Werkzeug debugger) to external callers — a security concern.

---

### W7 — No global error handler

No `@app.errorhandler` is registered for 404, 405, 500, or any exception type. Flask defaults apply, returning HTML error pages instead of JSON — inconsistent with the application's JSON contract.

**Risk:** API clients receive HTML on error paths, breaking any client that parses JSON responses.

---

### W8 — Missing `title` validation on task creation (D1)

`create_task()` calls `data.get("title", "")` and passes an empty string to `task_service.create()` without any guard. Tasks with blank titles are silently persisted.

**Risk:** Data integrity is violated at ingestion; downstream consumers have no guarantee that `title` is non-empty.

---

### W9 — In-memory storage with shared singleton

`TaskService` is instantiated once at module load (`task_service = TaskService()`) and shared across all requests. The `_tasks` dict and `_next_id` counter are not thread-safe. Running under a multi-threaded WSGI server would produce race conditions.

**Risk:** State is lost on restart; concurrent requests can corrupt the ID counter or task dict.

---

### W10 — Test isolation relies on direct internal state manipulation

`tests/test_app.py` resets state via `task_service._tasks.clear()` and `task_service._next_id = 1`, accessing private attributes directly. This couples the test suite to the internal implementation of `TaskService`.

**Risk:** Any rename or refactor of `TaskService` internals silently breaks all tests without a type-checker warning.

---

## 6. Defect Cross-Reference

| ID  | File                                  | Line(s)      | Description                           | Severity |
| --- | ------------------------------------- | ------------ | ------------------------------------- | -------- |
| D1  | `sample-app/app.py`                   | 44–45        | Missing title validation              | Medium   |
| D2  | `sample-app/app.py`                   | 24–25, 65–66 | 200 returned for missing task         | Medium   |
| D2  | `sample-app/services/task_service.py` | 12–13, 28–31 | None returned instead of signal       | Medium   |
| D3  | `sample-app/services/task_service.py` | 34           | Always sets status = "in_progress"    | **High** |
| D4  | `sample-app/app.py`                   | 41–42, 61–62 | Duplicated status validation          | Low      |
| D4  | `sample-app/utils/validators.py`      | entire file  | Dead utility — never imported         | Low      |
| D5  | `sample-app/services/task_service.py` | 39           | Unguarded KeyError on delete          | Medium   |
| D5  | `sample-app/app.py`                   | 72–73        | No exception handling in delete route | Medium   |
| D6  | `sample-app/app.py`                   | 5, 78        | Hard-coded debug=True                 | Medium   |
| D7  | `tests/test_app.py`                   | entire file  | Only 3 happy-path tests               | **High** |
| D8  | `sample-app/README.md`                | entire file  | Incomplete documentation              | Medium   |

---

## 7. Files Recommended for Deeper Inspection

| Priority  | File                                  | Reason                                                                      |
| --------- | ------------------------------------- | --------------------------------------------------------------------------- |
| 🔴 High   | `sample-app/app.py`                   | All routes live here; D1, D2, D4, D5, D6 are directly in this file          |
| 🔴 High   | `sample-app/services/task_service.py` | D2, D3, D5 are in this file; core business logic with the deterministic bug |
| 🟡 Medium | `tests/test_app.py`                   | Only 3 tests; all edge-case, negative, and regression paths are absent      |
| 🟡 Medium | `sample-app/utils/validators.py`      | Dead module; target for D4 consolidation — needs to be wired in             |
| 🟢 Low    | `sample-app/README.md`                | D8 — documentation gap, straightforward to remediate                        |
| 🟢 Low    | `sample-app/requirements.txt`         | No dev-dependency separation (pytest alongside flask in one file)           |

---

## 8. Baseline Metrics (Measured)

| Metric                                           | Value                                                        |
| ------------------------------------------------ | ------------------------------------------------------------ |
| Total source files                               | 4 (app.py, task_service.py, validators.py, requirements.txt) |
| Total test files                                 | 1 (test_app.py)                                              |
| Total automated tests                            | 3                                                            |
| Known defects                                    | 8 (D1–D8)                                                    |
| Defects with zero test coverage                  | 5 (D1, D2, D3, D5, D6)                                       |
| Duplicate validation sites                       | 3 (POST handler, PUT handler, validators.py unused)          |
| Error handlers registered                        | 0                                                            |
| API endpoints defined                            | 6 (health, GET all, GET one, POST, PUT, DELETE)              |
| Endpoints returning correct HTTP status on error | 1 of 4 error-producing paths (POST with no body)             |

---

_Report generated by DevGuard AI Architecture Agent. No production code was modified._
