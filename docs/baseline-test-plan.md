# DevGuard AI — Baseline Test Plan

## Initial Tests

The baseline repository should contain only a small test suite.

### Test 1
Health endpoint returns HTTP 200.

### Test 2
Creating a valid task succeeds.

### Test 3
Listing tasks succeeds.

## Tests intentionally missing initially

- missing title
- malformed JSON
- nonexistent task ID
- invalid status
- deletion
- regression test for status update bug
- error response consistency

## Why

The Test Agent should have genuine gaps to discover and improve.

## Final Expected Test Areas

After Bob improvement:

- health endpoint
- valid task creation
- invalid task creation
- malformed request
- list tasks
- fetch valid task
- fetch invalid task
- valid status update
- invalid status
- deterministic bug regression
- delete valid task
- delete invalid task