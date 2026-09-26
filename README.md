# DevGuard AI

## Autonomous Repository Rescue with IBM Bob 2.0

DevGuard AI is an AI-powered developer workflow that uses IBM Bob 2.0 to analyze an unfamiliar repository, identify engineering risks, repair prioritized defects, expand automated testing, improve documentation, and verify repository health.

## Problem

Developers often inherit repositories with:

- hidden bugs
- weak test coverage
- missing validation
- poor error handling
- incomplete documentation
- unclear architecture

Understanding and repairing these issues manually can take significant engineering time.

## Solution

DevGuard AI turns IBM Bob 2.0 into a structured repository rescue workflow:

Repository
→ Architecture Analysis
→ Risk Analysis
→ Test Gap Analysis
→ Repair
→ Documentation
→ Verification

## IBM Bob 2.0 Workflow

DevGuard AI uses specialized Bob tasks for:

1. Baseline application creation
2. Architecture analysis
3. Engineering risk analysis
4. Test-gap analysis
5. High-priority defect repair
6. Reliability and validation improvements
7. Documentation improvement
8. Final verification and health scoring

Required Bob task-session evidence is available in:

`bob_sessions/`

## Results

| Metric                   |    Before |      After |
| ------------------------ | --------: | ---------: |
| Repository Health Score  |    26/100 |     91/100 |
| Automated Tests          |         3 |         18 |
| Test Status              | 3 passing | 18 passing |
| Final Verification       |  Baseline |       PASS |
| Known Controlled Defects |         8 |  Addressed |

### Health Score Improvement

**26/100 → 91/100**

Improvement: **+65 points**

## Issues Addressed

- Missing task-title validation
- Incorrect missing-resource handling
- Deterministic task-status update bug
- Duplicated validation logic
- Unsafe deletion behavior
- Hard-coded Flask debug configuration
- Missing negative/error-path tests
- Incomplete developer documentation

## Repository Health Model

DevGuard AI evaluates repository quality across:

- Functional Correctness — 30 points
- Automated Testing — 25 points
- Reliability & Error Handling — 20 points
- Documentation — 15 points
- Maintainability — 10 points

Maximum score: **100**

## Technology Stack

- IBM Bob 2.0
- Python
- Flask
- pytest
- Git
- GitHub

## Project Structure

```text
DevGuard-AI/
├── bob-prompts/
├── bob_sessions/
├── docs/
├── results/
├── sample-app/
├── tests/
├── DATA_SOURCES.md
├── LICENSE
└── README.md
```
