# DevGuard AI — Test Gap Report

**Agent:** Test Agent  
**Date:** 2026-09-26  
**Status:** Baseline analysis — no tests added or modified

---

## 1. Scope

| Property | Value |
|----------|-------|
| Test file inspected | `tests/test_app.py` |
| Production files inspected | `sample-app/app.py`, `sample-app/services/task_service.py`, `sample-app/utils/validators.py` |
| Risk report cross-referenced | `results/risk-report.md` (RISK-01 through RISK-12) |
| Architecture report cross-referenced | `results/architecture-report.md` (W1–W10, D1–D8) |
| Baseline test plan cross-referenced | `docs/baseline-test-plan.md` |

---

## 2. Existing Test Inventory

**Current test count: 3**

| # | Test name | Endpoint | Type | Pass/Fail |
|---|-----------|----------|------|-----------|
| 1 | `test_health` | `GET /health` | Happy path | ✅ Passes |
| 2 | `test_create_task` | `POST /tasks` | Happy path | ✅ Passes |
| 3 | `test_list_tasks` | `GET /tasks` | Happy path | ✅ Passes |

All three tests exercise the simplest success path for three of the six endpoints. No test
exercises `GET /tasks/<id>`, `PUT /tasks/<id>`, or `DELETE /tasks/<id>` in any form.
No test exercises any error path. No test validates response body shape beyond checking a
single field.

---

## 3. Endpoint Coverage Matrix

| Endpoint | Happy path | Invalid input | Missing resource | Regression |
|----------|:----------:|:-------------:|:----------------:|:----------:|
| `GET /health` | ✅ T1 | — | — | — |
| `GET /tasks` | ✅ T3 | — | — | — |
| `GET /tasks/<id>` | ❌ | — | ❌ | — |
| `POST /tasks` | ✅ T2 | ❌ | — | — |
| `PUT /tasks/<id>` | ❌ | ❌ | ❌ | ❌ |
| `DELETE /tasks/<id>` | ❌ | — | ❌ | — |

**Legend:** ✅ covered · ❌ missing · — not applicable

---

## 4. Behaviors Already Tested

### T1 — Health endpoint returns 200
- **Test:** `test_health`
- **Behavior:** `GET /health` is reachable and returns HTTP 200.
- **Verdict:** Adequate for a health check — no gaps on this endpoint.

### T2 — Valid task creation returns 201 with body
- **Test:** `test_create_task`
- **Behavior:** `POST /tasks` with a well-formed payload returns 201 and a JSON body containing the correct `title`.
- **Verdict:** Covers the happy path only. No error paths tested.

### T3 — Listing tasks returns 200 with populated array
- **Test:** `test_list_tasks`
- **Behavior:** `GET /tasks` after one creation returns an array of length 1 with HTTP 200.
- **Verdict:** Covers the happy path only. Does not test the empty-list case or response shape.

---

## 5. Missing Tests — Full Catalogue

### MT-01 — GET /tasks/<id> for an existing task (Happy Path)
| Field | Value |
|-------|-------|
| **Test name** | `test_get_task_exists` |
| **Behavior protected** | `GET /tasks/<id>` for a known ID returns HTTP 200 and the correct task object |
| **Related risk/defect** | RISK-08 / D7 |
| **Expected result** | `200 OK`, body contains `id`, `title`, `status` fields matching the created task |
| **Priority** | 🟡 Medium — baseline happy path, precondition for the missing-resource test |

---

### MT-02 — GET /tasks/<id> for a nonexistent task (Missing Resource)
| Field | Value |
|-------|-------|
| **Test name** | `test_get_task_not_found` |
| **Behavior protected** | `GET /tasks/<id>` for an unknown ID must return HTTP 404, not HTTP 200 with `null` |
| **Related risk/defect** | RISK-02 / D2 |
| **Expected result** | `404 Not Found`, JSON body with an `error` key (e.g. `{"error": "Task not found"}`) |
| **Priority** | 🔴 High — directly exposes the REST contract violation catalogued in RISK-02 |

---

### MT-03 — PUT /tasks/<id> sets the requested status (Regression)
| Field | Value |
|-------|-------|
| **Test name** | `test_update_status_todo` |
| **Behavior protected** | `PUT /tasks/<id>` with `{"status": "todo"}` stores and returns `"todo"`, not `"in_progress"` |
| **Related risk/defect** | RISK-01 / D3 — deterministic status-update bug |
| **Expected result** | `200 OK`, returned `status` field equals `"todo"` |
| **Priority** | 🔴 Critical — the only regression test that would catch the D3 deterministic bug; CI currently passes silently while this feature is broken |

---

### MT-04 — PUT /tasks/<id> sets status to "done" (Regression variant)
| Field | Value |
|-------|-------|
| **Test name** | `test_update_status_done` |
| **Behavior protected** | `PUT /tasks/<id>` with `{"status": "done"}` stores and returns `"done"` |
| **Related risk/defect** | RISK-01 / D3 — second value that is silently overwritten by the bug |
| **Expected result** | `200 OK`, returned `status` field equals `"done"` |
| **Priority** | 🔴 Critical — complements MT-03; covers all three allowed status values |

---

### MT-05 — PUT /tasks/<id> with invalid status returns 400 (Error Path)
| Field | Value |
|-------|-------|
| **Test name** | `test_update_status_invalid` |
| **Behavior protected** | `PUT /tasks/<id>` with a disallowed status string returns HTTP 400 |
| **Related risk/defect** | RISK-08 / D7 — documented gap in test file; RISK-07 / D4 — validates the inline status check |
| **Expected result** | `400 Bad Request`, JSON body with an `error` key |
| **Priority** | 🟡 Medium — validates the status-validation path on PUT |

---

### MT-06 — PUT /tasks/<id> for a nonexistent task returns 404 (Missing Resource)
| Field | Value |
|-------|-------|
| **Test name** | `test_update_task_not_found` |
| **Behavior protected** | `PUT /tasks/<id>` for an unknown ID must return HTTP 404, not HTTP 200 with `null` |
| **Related risk/defect** | RISK-02 / D2 |
| **Expected result** | `404 Not Found`, JSON body with an `error` key |
| **Priority** | 🔴 High — second manifestation of the RISK-02 null-200 defect |

---

### MT-07 — DELETE /tasks/<id> for an existing task returns 200 (Happy Path)
| Field | Value |
|-------|-------|
| **Test name** | `test_delete_task_exists` |
| **Behavior protected** | `DELETE /tasks/<id>` for a known ID deletes the task and returns HTTP 200 |
| **Related risk/defect** | RISK-08 / D7 — documented gap; endpoint entirely untested |
| **Expected result** | `200 OK`, task is no longer returned by `GET /tasks` |
| **Priority** | 🟡 Medium — baseline happy path for the delete endpoint |

---

### MT-08 — DELETE /tasks/<id> for a nonexistent task returns 404 (Error Path)
| Field | Value |
|-------|-------|
| **Test name** | `test_delete_task_not_found` |
| **Behavior protected** | `DELETE /tasks/<id>` for an unknown ID must return HTTP 404, not crash with HTTP 500 |
| **Related risk/defect** | RISK-03 / D5 — unguarded `del` raises `KeyError` → HTTP 500 |
| **Expected result** | `404 Not Found`, JSON body with an `error` key (must NOT be a 500 or HTML response) |
| **Priority** | 🔴 Critical — the current behaviour is an HTTP 500 with an HTML traceback; this test will fail loudly until RISK-03 is repaired |

---

### MT-09 — POST /tasks with missing title returns 400 (Validation)
| Field | Value |
|-------|-------|
| **Test name** | `test_create_task_missing_title` |
| **Behavior protected** | `POST /tasks` without a `title` field must be rejected with HTTP 400 |
| **Related risk/defect** | RISK-04 / D1 — missing title validation; blank titles currently accepted as 201 |
| **Expected result** | `400 Bad Request`, JSON body with an `error` key explaining that `title` is required |
| **Priority** | 🔴 High — directly exposes the RISK-04 data-integrity defect |

---

### MT-10 — POST /tasks with empty string title returns 400 (Validation variant)
| Field | Value |
|-------|-------|
| **Test name** | `test_create_task_empty_title` |
| **Behavior protected** | `POST /tasks` with `{"title": ""}` must be rejected with HTTP 400 |
| **Related risk/defect** | RISK-04 / D1 — empty string bypasses the missing-key guard |
| **Expected result** | `400 Bad Request`, JSON body with an `error` key |
| **Priority** | 🔴 High — edge case of MT-09; empty string is a distinct code path from the absent key |

---

### MT-11 — POST /tasks with no JSON body returns 400 (Malformed Request)
| Field | Value |
|-------|-------|
| **Test name** | `test_create_task_no_body` |
| **Behavior protected** | `POST /tasks` with no body (or non-JSON `Content-Type`) returns HTTP 400 |
| **Related risk/defect** | RISK-08 / D7 — documented gap in the test file |
| **Expected result** | `400 Bad Request`, JSON body with an `error` key; must NOT crash |
| **Priority** | 🟡 Medium — the route already returns 400 on `not data`; this test locks in that behaviour |

---

### MT-12 — POST /tasks with invalid status returns 400 (Validation)
| Field | Value |
|-------|-------|
| **Test name** | `test_create_task_invalid_status` |
| **Behavior protected** | `POST /tasks` with an unrecognised status string returns HTTP 400 |
| **Related risk/defect** | RISK-07 / D4 — inline status validation duplication; RISK-08 / D7 |
| **Expected result** | `400 Bad Request`, JSON body with an `error` key |
| **Priority** | 🟡 Medium — validates the POST status-validation code path |

---

### MT-13 — GET /tasks returns empty list when no tasks exist (Edge Case)
| Field | Value |
|-------|-------|
| **Test name** | `test_list_tasks_empty` |
| **Behavior protected** | `GET /tasks` on a fresh store returns HTTP 200 with an empty JSON array `[]` |
| **Related risk/defect** | RISK-08 / D7 — undocumented edge case not covered by T3 |
| **Expected result** | `200 OK`, body is `[]` |
| **Priority** | 🟢 Low — the current code handles this correctly but no test guards it |

---

### MT-14 — Response Content-Type is application/json on all routes (Contract)
| Field | Value |
|-------|-------|
| **Test name** | `test_response_content_type` |
| **Behavior protected** | All successful JSON responses carry `Content-Type: application/json` |
| **Related risk/defect** | RISK-06 — no global error handler; error responses are HTML |
| **Expected result** | `Content-Type` header contains `application/json` on `/health`, `GET /tasks`, `POST /tasks` |
| **Priority** | 🟢 Low — Flask's `jsonify` sets this automatically; guards against accidental regression |

---

### MT-15 — Unsupported HTTP method returns 405 (Error Path)
| Field | Value |
|-------|-------|
| **Test name** | `test_method_not_allowed` |
| **Behavior protected** | A request using an unsupported method (e.g. `PATCH /tasks/1`) returns HTTP 405 with a JSON body (not HTML) |
| **Related risk/defect** | RISK-06 — no global error handler causes Flask to return an HTML 405 page |
| **Expected result** | `405 Method Not Allowed`, JSON body with an `error` key (will fail until RISK-06 is fixed) |
| **Priority** | 🟡 Medium — currently returns HTML; test locks in the JSON contract after repair |

---

### MT-16 — GET /tasks/<id> response body includes all required fields (Contract)
| Field | Value |
|-------|-------|
| **Test name** | `test_get_task_response_shape` |
| **Behavior protected** | The task object returned by `GET /tasks/<id>` contains `id`, `title`, `description`, and `status` fields |
| **Related risk/defect** | RISK-08 / D7 — no structural contract test exists |
| **Expected result** | `200 OK`, body is a dict with all four required keys |
| **Priority** | 🟢 Low — guards API contract shape; no defect linked but useful for long-term stability |

---

## 6. Risk-to-Test Mapping

| Risk ID | Severity | Defect | Covered by existing tests | Missing tests that expose it |
|---------|----------|--------|:------------------------:|------------------------------|
| RISK-01 | Critical | D3 | ❌ None | MT-03, MT-04 |
| RISK-02 | High | D2 | ❌ None | MT-02, MT-06 |
| RISK-03 | High | D5 | ❌ None | MT-08 |
| RISK-04 | High | D1 | ❌ None | MT-09, MT-10 |
| RISK-05 | High | D6 | ❌ None | — (config risk; not testable via HTTP) |
| RISK-06 | Medium | — | ❌ None | MT-15 |
| RISK-07 | Medium | D4 | Partially (T2 exercises POST status check indirectly) | MT-05, MT-12 |
| RISK-08 | High | D7 | ❌ None | MT-01 through MT-16 collectively |
| RISK-09 | Low | D8 | — (documentation; not testable) | — |
| RISK-10 | Low | — | ❌ (the test fixture itself is the risk) | — |
| RISK-11 | Low | — | — (dependency management; not testable) | — |
| RISK-12 | Low | — | ❌ None | — (concurrency; not in scope for unit tests) |

**Defects with zero test coverage: D1, D2, D3, D5, D6 (5 of 8)**

---

## 7. Prioritised Test Queue

Tests are ordered by the severity of the defect they expose.

| Priority | Test ID | Test name | Defect / Risk | Rationale |
|----------|---------|-----------|---------------|-----------|
| 1 | MT-03 | `test_update_status_todo` | D3 / RISK-01 | The highest-severity bug is completely invisible in CI |
| 2 | MT-04 | `test_update_status_done` | D3 / RISK-01 | Covers the third value overwritten by the bug |
| 3 | MT-08 | `test_delete_task_not_found` | D5 / RISK-03 | Current behaviour is HTTP 500 + HTML traceback |
| 4 | MT-09 | `test_create_task_missing_title` | D1 / RISK-04 | Data integrity at ingestion point |
| 5 | MT-10 | `test_create_task_empty_title` | D1 / RISK-04 | Edge case of MT-09 |
| 6 | MT-02 | `test_get_task_not_found` | D2 / RISK-02 | REST contract violation on GET |
| 7 | MT-06 | `test_update_task_not_found` | D2 / RISK-02 | REST contract violation on PUT |
| 8 | MT-01 | `test_get_task_exists` | D7 / RISK-08 | Happy path precondition for MT-02 |
| 9 | MT-07 | `test_delete_task_exists` | D7 / RISK-08 | Happy path precondition for MT-08 |
| 10 | MT-05 | `test_update_status_invalid` | D4 / RISK-07 | Validates PUT status validation path |
| 11 | MT-11 | `test_create_task_no_body` | D7 / RISK-08 | Locks in existing correct behaviour |
| 12 | MT-12 | `test_create_task_invalid_status` | D4 / RISK-07 | Validates POST status validation path |
| 13 | MT-15 | `test_method_not_allowed` | RISK-06 | JSON contract on 405 — needs error handler repair first |
| 14 | MT-13 | `test_list_tasks_empty` | D7 / RISK-08 | Edge case; currently handled correctly |
| 15 | MT-14 | `test_response_content_type` | RISK-06 | Content-Type contract guard |
| 16 | MT-16 | `test_get_task_response_shape` | D7 / RISK-08 | Structural contract test |

---

## 8. Proposed Final Test Suite

After all repairs are applied, the complete test suite should contain the following 19 tests
(3 existing + 16 new):

### Category A — Health (1 test)
- `test_health` ✅ existing

### Category B — List Tasks (2 tests)
- `test_list_tasks` ✅ existing  
- `test_list_tasks_empty` 🆕 MT-13

### Category C — Create Task (5 tests)
- `test_create_task` ✅ existing  
- `test_create_task_missing_title` 🆕 MT-09  
- `test_create_task_empty_title` 🆕 MT-10  
- `test_create_task_no_body` 🆕 MT-11  
- `test_create_task_invalid_status` 🆕 MT-12  

### Category D — Fetch Single Task (3 tests)
- `test_get_task_exists` 🆕 MT-01  
- `test_get_task_not_found` 🆕 MT-02  
- `test_get_task_response_shape` 🆕 MT-16  

### Category E — Update Task Status (4 tests — includes regressions)
- `test_update_status_todo` 🆕 MT-03 ← D3 regression  
- `test_update_status_done` 🆕 MT-04 ← D3 regression  
- `test_update_status_invalid` 🆕 MT-05  
- `test_update_task_not_found` 🆕 MT-06  

### Category F — Delete Task (2 tests)
- `test_delete_task_exists` 🆕 MT-07  
- `test_delete_task_not_found` 🆕 MT-08 ← D5 regression  

### Category G — Error Contract (2 tests)
- `test_method_not_allowed` 🆕 MT-15  
- `test_response_content_type` 🆕 MT-14  

---

## 9. Summary

### Current Test Count

| Metric | Value |
|--------|-------|
| Total tests (baseline) | **3** |
| Endpoints with any test | 3 of 6 |
| Endpoints with error-path test | 0 of 6 |
| Defects with test coverage | 0 of 5 testable defects |

### Missing Important Tests

| Metric | Value |
|--------|-------|
| Missing tests identified | **16** |
| Missing **critical/high** priority tests | **7** (MT-02, MT-03, MT-04, MT-06, MT-08, MT-09, MT-10) |
| Missing **medium** priority tests | **4** (MT-01, MT-05, MT-07, MT-15) |
| Missing **low** priority tests | **5** (MT-11, MT-12, MT-13, MT-14, MT-16) |

### Top Regression Tests to Add First

1. **MT-03** `test_update_status_todo` — Exposes the D3 deterministic bug (RISK-01, Critical)
2. **MT-04** `test_update_status_done` — Second regression for D3
3. **MT-08** `test_delete_task_not_found` — Exposes the D5 KeyError → HTTP 500 (RISK-03, High)
4. **MT-09** `test_create_task_missing_title` — Exposes D1 title validation gap (RISK-04, High)
5. **MT-02** `test_get_task_not_found` — Exposes D2 null-200 on GET (RISK-02, High)
6. **MT-06** `test_update_task_not_found` — Exposes D2 null-200 on PUT (RISK-02, High)
7. **MT-10** `test_create_task_empty_title` — Edge case for D1 empty-string bypass

### Final Recommended Test Categories

| Category | Count | Covers |
|----------|-------|--------|
| A — Health | 1 | Basic availability |
| B — List Tasks | 2 | Happy path + empty-store edge case |
| C — Create Task | 5 | Happy path, validation, malformed input |
| D — Fetch Single Task | 3 | Happy path, 404, response shape |
| E — Update Task Status | 4 | Happy path ×2 (regression), invalid status, 404 |
| F — Delete Task | 2 | Happy path, 404 (D5 regression) |
| G — Error Contract | 2 | Content-Type, 405 method-not-allowed |
| **Total** | **19** | All 6 endpoints, all known defects |

---

_Report generated by DevGuard AI Test Agent. No production code or tests were modified._
