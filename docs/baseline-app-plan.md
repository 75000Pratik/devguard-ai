# DevGuard AI — Baseline App Plan

## App Type

Small Flask REST API for task management.

## Endpoints

### GET /health
Returns application health.

### GET /tasks
Returns all tasks.

### GET /tasks/<id>
Returns one task.

### POST /tasks
Creates a task.

Expected fields:
- title
- description
- status

### PUT /tasks/<id>
Updates task status.

Allowed status values:
- todo
- in_progress
- done

### DELETE /tasks/<id>
Deletes a task.

## Baseline Modules

### sample-app/app.py
Responsible for:
- Flask app setup
- routes
- HTTP responses
- application startup

### sample-app/services/task_service.py
Responsible for:
- task storage
- create task
- fetch task
- update task
- delete task

### sample-app/utils/validators.py
Initially contains very limited validation.

### tests/test_app.py
Contains only a few basic tests.

## Intentional Baseline Problems

### D1
POST /tasks accepts missing title.

### D2
GET /tasks/<id> does not return proper 404 behavior.

### D3
PUT /tasks/<id> has a deterministic status update bug.

### D4
Validation logic is duplicated.

### D5
Unexpected errors are not consistently handled.

### D6
Flask debug mode is enabled directly in code.

### D7
Tests cover only happy paths.

### D8
README is incomplete.

## Baseline Success Condition

The app must still run.

Important:
The repository should be imperfect, not unusable.

The demo must show:

Working application
+ measurable engineering problems
+ Bob-led improvement
+ successful verification afterward.