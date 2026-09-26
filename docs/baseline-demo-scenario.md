# DevGuard AI — Baseline Demo Scenario

## Scenario

A developer inherits a small Flask repository from another team.

The application runs, but its engineering quality is unknown.

The developer asks DevGuard AI:

"Assess this repository, identify the most important engineering problems, repair them, improve its tests and documentation, and verify that the repository is ready for another developer to maintain."

## Before DevGuard

Demonstrate:

1. Application starts
2. Normal task creation works
3. Invalid task creation behaves incorrectly
4. Invalid IDs behave incorrectly
5. Status update exposes the deterministic bug
6. Test suite is incomplete
7. Documentation is poor

## DevGuard Workflow

IBM Bob performs:

Repository Understanding
→ Risk Analysis
→ Test Gap Analysis
→ Prioritization
→ Repair
→ Test Generation
→ Documentation
→ Verification

## After DevGuard

Demonstrate:

1. Invalid requests are rejected correctly
2. Missing resources return 404
3. Status updates work correctly
4. Tests cover important failure paths
5. Full test suite passes
6. Documentation explains the application
7. DevGuard produces a final repository report

## Key Demo Question

Instead of:

"Can AI write code?"

The project demonstrates:

"Can an AI development system take responsibility for improving the health of an unfamiliar repository?"