# DevGuard AI — Hackathon Blueprint

## 1. Goal

Build an IBM Bob-powered repository rescue workflow that can take an unfamiliar or unhealthy codebase and improve it through a coordinated sequence of analysis, repair, testing, documentation, and verification.

## 2. Core Demo Story

A developer inherits a messy project.

DevGuard AI uses IBM Bob to:

1. Understand the repository
2. Detect architecture and code-quality problems
3. Find bugs and risks
4. Generate missing tests
5. Fix selected issues
6. Improve documentation
7. Re-run validation
8. Produce a final repository health report

## 3. Planned Agent Roles

### Architecture Agent

- map repository structure
- identify main modules
- explain data flow
- identify dependencies

### Risk Agent

- find bugs
- detect weak validation
- detect unsafe configuration
- identify maintainability problems

### Test Agent

- inspect current tests
- identify coverage gaps
- generate missing tests

### Fix Agent

- repair prioritized issues
- preserve existing behavior
- keep changes minimal and reviewable

### Documentation Agent

- improve README
- document APIs
- document setup and usage

### Verification Agent

- run tests
- run application
- verify expected behavior
- compare before and after state

## 4. Metrics

We will measure real values during the hackathon.

Possible metrics:

- number of bugs found
- number of bugs fixed
- failing tests before vs after
- test coverage before vs after
- undocumented endpoints before vs after
- repository health score
- approximate manual time vs Bob-assisted time

## 5. Planned Repository Structure

DevGuard-AI/
├── sample-app/
├── tests/
├── docs/
├── bob-prompts/
├── results/
├── screenshots/
└── README.md

## 6. Sample App Requirements

The sample application should contain realistic but controlled problems, such as:

- missing input validation
- poor exception handling
- duplicated code
- insecure or weak configuration
- insufficient tests
- incomplete documentation
- one or more deterministic bugs

The problems should be easy to demonstrate before and after Bob intervention.

## 7. Final Submission Assets

We will prepare:

- GitHub repository
- polished README
- architecture diagram
- Bob session screenshots
- before/after metrics
- demo video
- presentation
- submission description
- setup instructions

## 8. Judging Strategy

### Application of Technology

Show real use of IBM Bob for multi-step developer workflows.

### Business Value

Show time saved, reduced rework, and improved repository maintainability.

### Originality

Focus on autonomous repository rescue rather than simple code generation.

### Presentation

Use a clear before → Bob workflow → after story.

## 9. Demo Flow

1. Show the unhealthy repository
2. Run baseline tests
3. Show missing docs / bugs / weak structure
4. Start Bob workflow
5. Show architecture analysis
6. Show bug detection
7. Show generated fixes/tests/docs
8. Re-run verification
9. Show final DevGuard report
10. Show before/after metrics

## 10. Success Criteria

The final demo should make it obvious that:

- the repository improved
- Bob performed meaningful work
- the workflow is repeatable
- the results are measurable
- the solution saves developer time
