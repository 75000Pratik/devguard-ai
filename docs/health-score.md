# DevGuard AI — Repository Health Score

## Purpose

DevGuard AI uses a measurable health score to compare repository quality before and after the IBM Bob workflow.

The score is based on five categories totaling 100 points.

## Scoring Model

### 1. Functional Correctness — 30 points
- Core endpoints work correctly: 10
- Known functional bugs resolved: 10
- Invalid inputs handled correctly: 10

### 2. Automated Testing — 25 points
- Core happy paths tested: 5
- Important failure paths tested: 10
- Regression tests added for discovered bugs: 5
- Full test suite passes: 5

### 3. Reliability & Error Handling — 20 points
- Missing resources handled correctly: 5
- Malformed requests handled safely: 5
- Exceptions produce consistent responses: 5
- Unsafe debug/runtime configuration corrected: 5

### 4. Documentation — 15 points
- Setup instructions: 3
- Run instructions: 3
- API documentation: 4
- Testing instructions: 2
- Architecture / developer overview: 3

### 5. Maintainability — 10 points
- Duplicate logic reduced: 3
- Clear module responsibilities: 3
- Reasonable naming / structure: 2
- Remaining known risks documented: 2

## Total

Repository Health Score =

Functional Correctness
+ Automated Testing
+ Reliability
+ Documentation
+ Maintainability

Maximum score: 100

## Health Levels

- 90–100: Excellent
- 75–89: Healthy
- 60–74: Needs Improvement
- 40–59: Risky
- Below 40: Critical

## Rule

Every awarded point must be backed by repository evidence.

Do not increase the score simply because Bob made changes.