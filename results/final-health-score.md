# DevGuard AI — Final Repository Health Score

**Agent:** Verification Agent  
**Date:** 2026-09-26  
**Scoring model:** `docs/health-score.md`  
**Rule:** Every awarded point is backed by evidence from the repository and actual test results.

---

## Before Bob — Baseline Score

### 1. Functional Correctness — 7 / 30

| Sub-item | Max | Awarded | Evidence |
|----------|----:|--------:|---------|
| Core endpoints work correctly | 10 | 4 | `GET /health`, `GET /tasks`, and `POST /tasks` (happy path) worked. `PUT`, `GET /<id>`, `DELETE` were all broken or untested. |
| Known functional bugs resolved | 10 | 0 | D1–D6 all open. `update_status` always wrote `"in_progress"` (D3); `DELETE` raised `KeyError` on missing IDs (D5); blank tasks accepted (D1). |
| Invalid inputs handled correctly | 10 | 3 | `POST` with no body returned 400 by coincidence (`not data` check). All other invalid-input paths returned wrong codes or crashed. |

**Subtotal: 7 / 30**

---

### 2. Automated Testing — 4 / 25

| Sub-item | Max | Awarded | Evidence |
|----------|----:|--------:|---------|
| Core happy paths tested | 5 | 3 | Three tests: health, create, list. Only 3 of 6 endpoints covered. |
| Important failure paths tested | 10 | 0 | Zero error-path tests existed. |
| Regression tests added for discovered bugs | 5 | 0 | No regression tests for any of D1–D6. |
| Full test suite passes | 5 | 1 | The 3 existing tests passed, but they covered a tiny fraction of the surface. |

**Subtotal: 4 / 25**

---

### 3. Reliability & Error Handling — 5 / 20

| Sub-item | Max | Awarded | Evidence |
|----------|----:|--------:|---------|
| Missing resources handled correctly | 5 | 0 | `GET /tasks/<id>` returned 200 + `null`; `PUT` returned 200 + `null`; `DELETE` raised a 500 (D2, D5). |
| Malformed requests handled safely | 5 | 3 | `POST` with no body returned 400. All other malformed-request paths were untested or crashed. |
| Exceptions produce consistent responses | 5 | 0 | No global error handlers; Flask returned HTML on unhandled errors (D5 → 500, D7). |
| Unsafe debug/runtime configuration corrected | 5 | 2 | App ran; `DEBUG=True` was hard-coded but did not prevent the server from starting in a basic test environment. |

**Subtotal: 5 / 20**

---

### 4. Documentation — 3 / 15

| Sub-item | Max | Awarded | Evidence |
|----------|----:|--------:|---------|
| Setup instructions | 3 | 0 | README had no installation steps (D8). |
| Run instructions | 3 | 1 | README implied `python app.py` but no explicit instructions were present. |
| API documentation | 4 | 0 | No endpoint reference, no request/response examples (D8). |
| Testing instructions | 2 | 0 | No test-running instructions (D8). |
| Architecture / developer overview | 3 | 2 | Architecture was discoverable from the source code but not documented. Agent-generated architecture report was present in `results/`. |

**Subtotal: 3 / 15**

---

### 5. Maintainability — 7 / 10

| Sub-item | Max | Awarded | Evidence |
|----------|----:|--------:|---------|
| Duplicate logic reduced | 3 | 0 | Status validation duplicated in POST, PUT, and `validators.py` (unused) — D4. |
| Clear module responsibilities | 3 | 3 | `app.py`, `task_service.py`, `validators.py` had clear names and single responsibilities (even if `validators.py` was dead). |
| Reasonable naming / structure | 2 | 2 | Variable names, function names, and file structure were all reasonable. |
| Remaining known risks documented | 2 | 2 | The DevGuard AI agent reports in `results/` documented all known risks and limitations. |

**Subtotal: 7 / 10**

---

### Baseline Total: **26 / 100 — Critical**

| Category | Max | Before |
|----------|----:|-------:|
| Functional Correctness | 30 | 7 |
| Automated Testing | 25 | 4 |
| Reliability & Error Handling | 20 | 5 |
| Documentation | 15 | 3 |
| Maintainability | 10 | 7 |
| **Total** | **100** | **26** |

---

## After Bob — Final Score

### 1. Functional Correctness — 29 / 30

| Sub-item | Max | Awarded | Evidence |
|----------|----:|--------:|---------|
| Core endpoints work correctly | 10 | 10 | All 6 endpoints return correct HTTP status codes and JSON bodies on happy-path requests. Verified by 18 passing tests. |
| Known functional bugs resolved | 10 | 10 | D1 (title validation), D2 (404 on missing resource), D3 (status update writes correct value), D5 (safe delete) — all fixed and verified by regression tests. |
| Invalid inputs handled correctly | 10 | 9 | All tested invalid-input paths return correct 400/404 JSON responses. One point withheld because `test_response_content_type` (MT-14) was not implemented; Content-Type correctness is validated only indirectly via `get_json()` assertions. |

**Subtotal: 29 / 30**

---

### 2. Automated Testing — 24 / 25

| Sub-item | Max | Awarded | Evidence |
|----------|----:|--------:|---------|
| Core happy paths tested | 5 | 5 | Tests 1–3, plus `test_get_task_exists`, `test_delete_task_exists`, `test_update_status_done` — all 6 endpoints covered. |
| Important failure paths tested | 10 | 10 | `test_create_task_missing_title`, `test_create_task_empty_title`, `test_create_task_no_body`, `test_get_task_not_found`, `test_update_task_not_found`, `test_delete_task_not_found`, `test_update_status_invalid`, `test_create_task_invalid_status`, `test_method_not_allowed` all pass. |
| Regression tests added for discovered bugs | 5 | 5 | MT-03, MT-04 (D3), MT-08 (D5), MT-09/10 (D1), MT-02/06 (D2) all present and passing. |
| Full test suite passes | 5 | 4 | 18/18 tests pass. One point withheld for the unimplemented MT-14 (`test_response_content_type`) which was in the planned suite of 19. |

**Subtotal: 24 / 25**

---

### 3. Reliability & Error Handling — 19 / 20

| Sub-item | Max | Awarded | Evidence |
|----------|----:|--------:|---------|
| Missing resources handled correctly | 5 | 5 | `GET /tasks/9999` → 404; `PUT /tasks/9999` → 404; `DELETE /tasks/9999` → 404. All verified by tests. |
| Malformed requests handled safely | 5 | 5 | `POST` with non-JSON body returns JSON 400 (`test_create_task_no_body`). No crashes on any tested malformed input. |
| Exceptions produce consistent responses | 5 | 5 | Global `@app.errorhandler` for 400, 404, and 405 registered in `app.py`. `test_method_not_allowed` confirms JSON 405 body. |
| Unsafe debug/runtime configuration corrected | 5 | 4 | `FLASK_DEBUG` env-var gate implemented (D6). One point withheld because `pytest` still co-exists with `flask` in `requirements.txt` (no dev-dependency separation — L7). |

**Subtotal: 19 / 20**

---

### 4. Documentation — 14 / 15

| Sub-item | Max | Awarded | Evidence |
|----------|----:|--------:|---------|
| Setup instructions | 3 | 3 | Venv creation, activation, and `pip install -r requirements.txt` documented in README. |
| Run instructions | 3 | 3 | `cd sample-app && python app.py` documented with debug-mode toggle examples. |
| API documentation | 4 | 4 | Full endpoint table, allowed-status reference, request/response examples for every route, error-behavior table. |
| Testing instructions | 2 | 2 | `pytest tests/test_app.py -v` with explanation of path requirements. |
| Architecture / developer overview | 3 | 2 | ASCII flow diagram and layer table present. One point withheld because the diagram does not document the error-handler layer explicitly (it references it only in the flow text). |

**Subtotal: 14 / 15**

---

### 5. Maintainability — 5 / 10

| Sub-item | Max | Awarded | Evidence |
|----------|----:|--------:|---------|
| Duplicate logic reduced | 3 | 3 | `is_valid_status()` and `validate_task_payload()` in `validators.py` are the single source of truth for status and payload validation. Both inline duplicates in `app.py` are gone. |
| Clear module responsibilities | 3 | 3 | `app.py` (routing + error handlers), `task_service.py` (CRUD), `validators.py` (validation) — clean separation. |
| Reasonable naming / structure | 2 | 2 | No naming or structural regressions introduced. |
| Remaining known risks documented | 2 | 2 | Limitations L1–L8 fully documented in README Known Limitations table. |

**Note:** Full score awarded for maintainability. The two items that were previously risks (W2 dead validators, W5 unguarded delete) are resolved. Remaining risks (L1–L8) are all acknowledged limitations, not overlooked defects.

**Subtotal: 10 / 10**

> *Correction: Subtotal recalculated as 10/10 — all four sub-items earned full marks.*

---

### Final Total: **91 / 100 — Excellent**

| Category | Max | Before | After | Delta |
|----------|----:|-------:|------:|------:|
| Functional Correctness | 30 | 7 | 29 | **+22** |
| Automated Testing | 25 | 4 | 24 | **+20** |
| Reliability & Error Handling | 20 | 5 | 19 | **+14** |
| Documentation | 15 | 3 | 14 | **+11** |
| Maintainability | 10 | 7 | 10 | **+3** |
| **Total** | **100** | **26** | **91** | **+65** |

---

## Health Level

| Range | Level | Status |
|-------|-------|--------|
| 90–100 | Excellent | ← **Current: 91** |
| 75–89 | Healthy | |
| 60–74 | Needs Improvement | |
| 40–59 | Risky | |
| Below 40 | Critical | ← Baseline: 26 |

---

## Score Deductions Summary

| Deduction | Points | Reason |
|-----------|-------:|--------|
| `test_response_content_type` not implemented | −1 (Testing) | MT-14 was planned but not added to `test_app.py` |
| `test_response_content_type` not implemented | −1 (Functional) | Content-Type correctness not explicitly asserted |
| `pytest` not separated from production deps | −1 (Reliability) | `requirements.txt` mixes Flask and pytest — L7 |
| Architecture doc omits error-handler layer | −1 (Documentation) | README diagram does not label the 400/404/405 handler block |
| **Total deducted** | **−4** | |

---

## Evidence Index

| Score item | File | Line(s) | Test(s) |
|------------|------|---------|---------|
| D1 fixed | `sample-app/utils/validators.py` | 13–26 | `test_create_task_missing_title`, `test_create_task_empty_title` |
| D2 fixed (GET) | `sample-app/app.py` | 55–57 | `test_get_task_not_found` |
| D2 fixed (PUT) | `sample-app/app.py` | 92–93 | `test_update_task_not_found` |
| D3 fixed | `sample-app/services/task_service.py` | 32 | `test_update_status_todo`, `test_update_status_done` |
| D4 fixed | `sample-app/utils/validators.py` | 5–26; `app.py` imports | `test_create_task_invalid_status`, `test_update_status_invalid` |
| D5 fixed | `sample-app/services/task_service.py` | 36–38; `app.py` 99–101 | `test_delete_task_not_found` |
| D6 fixed | `sample-app/app.py` | 12–13, 107–111 | Code inspection (not HTTP-testable) |
| D7 fixed | `tests/test_app.py` | 1–188 | All 18 tests |
| D8 fixed | `sample-app/README.md` | Entire file | Human review |
| Global error handlers | `sample-app/app.py` | 20–36 | `test_method_not_allowed` |
| Validators consolidated | `sample-app/utils/validators.py` | 8–26 | `test_create_task_invalid_status`, `test_update_status_invalid` |

---

_Score calculated by DevGuard AI Verification Agent. All points are backed by repository evidence. No points awarded on assumption._
