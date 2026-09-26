# DevGuard AI — Sample App Specification

## Purpose

Create a small Flask API that looks realistic but contains controlled engineering problems for IBM Bob to detect and improve during the hackathon.

## App Concept

A simple task-management REST API.

Users can:

- create tasks
- list tasks
- update task status
- delete tasks
- get a simple health endpoint

## Planned Files

sample-app/
├── app.py
├── services/
│   └── task_service.py
├── utils/
│   └── validators.py
├── requirements.txt
└── README.md

tests/
└── test_app.py

## Planned Controlled Problems

The initial version should intentionally include:

1. Missing validation for required fields
2. Weak handling of invalid task IDs
3. Duplicate validation logic
4. Hard-coded debug configuration
5. Poor or missing exception handling
6. Minimal test coverage
7. Incomplete README
8. One deterministic bug in task-status update behavior

## Important Rule

The flaws must be realistic and safe.

Do not add:
- real credentials
- destructive behavior
- malware-like code
- dangerous security vulnerabilities
- external paid services

## Baseline Metrics to Capture

Before Bob changes anything:

- total tests
- passing tests
- failing tests
- API endpoints
- known bugs
- validation gaps
- documentation gaps
- estimated manual repair steps

## Expected After-State

After the Bob workflow:

- validation added
- deterministic bug fixed
- error handling improved
- tests expanded
- README improved
- debug configuration corrected
- final verification passes
- before/after report generated