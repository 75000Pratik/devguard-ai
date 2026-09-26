# DevGuard AI — Baseline Defect Matrix

## Goal

The sample application must contain realistic, controlled defects that IBM Bob can discover, prioritize, repair, test, and document.

## Planned Defects

### D1 — Missing Required Field Validation
Endpoint:
POST /tasks

Problem:
The API accepts task objects without a title.

Expected Bob improvement:
Reject invalid requests with HTTP 400 and a clear message.

Severity:
Medium

---

### D2 — Invalid Task ID Handling
Endpoint:
GET /tasks/<id>

Problem:
Requesting a missing task may cause incorrect behavior instead of returning HTTP 404.

Expected Bob improvement:
Return a structured 404 response.

Severity:
Medium

---

### D3 — Status Update Logic Bug
Endpoint:
PUT /tasks/<id>

Problem:
The status-update function modifies the wrong field or applies an invalid status incorrectly.

Expected Bob improvement:
Correct status handling and validate allowed status values.

Severity:
High

---

### D4 — Duplicate Validation Logic

Problem:
Similar validation code exists in multiple locations.

Expected Bob improvement:
Move shared validation into utils/validators.py.

Severity:
Low

---

### D5 — Weak Exception Handling

Problem:
Unexpected exceptions are exposed or result in inconsistent API responses.

Expected Bob improvement:
Add consistent error handling.

Severity:
Medium

---

### D6 — Debug Configuration

Problem:
The application is configured with debug mode enabled directly in code.

Expected Bob improvement:
Use safer environment-based configuration.

Severity:
Medium

---

### D7 — Insufficient Tests

Problem:
Only basic happy-path behavior is tested.

Missing tests should include:

- missing title
- invalid task ID
- invalid status
- task deletion
- malformed request
- health endpoint

Expected Bob improvement:
Expand automated test coverage.

Severity:
High

---

### D8 — Incomplete Documentation

Problem:
The sample app README lacks:

- installation steps
- endpoint documentation
- example requests
- expected responses
- testing instructions

Expected Bob improvement:
Generate complete developer documentation.

Severity:
Medium

---

# Baseline Measurements

Before IBM Bob changes the repository, record:

| Metric | Before | After |
|---|---:|---:|
| Total automated tests | TBD | TBD |
| Passing tests | TBD | TBD |
| Failing tests | TBD | TBD |
| Known defects | 8 | TBD |
| Defects fixed | 0 | TBD |
| Validation gaps | TBD | TBD |
| Documented endpoints | TBD | TBD |
| Test coverage | TBD | TBD |
| Verification status | FAIL | TBD |

Only use real measured values during the final submission.