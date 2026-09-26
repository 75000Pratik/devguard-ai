/* ─────────────────────────────────────────────────────────────
   DevGuard AI Dashboard — script.js
   All data sourced from verified repository results.
───────────────────────────────────────────────────────────── */

/* ── 1. Data ─────────────────────────────────────────────── */

const SCORE_BEFORE = 26;
const SCORE_AFTER  = 91;
const SCORE_DELTA  = 65;
const TESTS_BEFORE = 3;
const TESTS_AFTER  = 18;

const BREAKDOWN = [
  { label: 'Functional Correctness', max: 30, before:  7, after: 29, delta: '+22' },
  { label: 'Automated Testing',      max: 25, before:  4, after: 24, delta: '+20' },
  { label: 'Reliability & Error Handling', max: 20, before: 5, after: 19, delta: '+14' },
  { label: 'Documentation',          max: 15, before:  3, after: 14, delta: '+11' },
  { label: 'Maintainability',        max: 10, before:  7, after: 10, delta: '+3'  },
];

// Baseline tests are marked separately so they render with a different dot colour
const TESTS = [
  { name: 'test_health',                   baseline: true  },
  { name: 'test_create_task',              baseline: true  },
  { name: 'test_list_tasks',               baseline: true  },
  { name: 'test_get_task_exists',          baseline: false },
  { name: 'test_get_task_not_found',       baseline: false },
  { name: 'test_create_task_missing_title',baseline: false },
  { name: 'test_create_task_empty_title',  baseline: false },
  { name: 'test_create_task_no_body',      baseline: false },
  { name: 'test_create_task_invalid_status', baseline: false },
  { name: 'test_update_status_done',       baseline: false },
  { name: 'test_update_status_todo',       baseline: false },
  { name: 'test_update_status_invalid',    baseline: false },
  { name: 'test_update_task_not_found',    baseline: false },
  { name: 'test_delete_task_exists',       baseline: false },
  { name: 'test_delete_task_not_found',    baseline: false },
  { name: 'test_method_not_allowed',       baseline: false },
  { name: 'test_get_all_tasks',            baseline: false },
  { name: 'test_task_shape',               baseline: false },
];

const DEFECTS = [
  {
    id: 'D1',
    title: 'Missing Required Field Validation',
    desc: 'POST /tasks accepted blank or missing titles. Rejected with 400 {"error": "title is required"} after fix.',
  },
  {
    id: 'D2',
    title: 'Invalid Task ID Returns HTTP 200/null',
    desc: 'GET and PUT on missing IDs returned 200 + null. Now return 404 {"error": "Task not found"}.',
  },
  {
    id: 'D3',
    title: 'Status Update Always Writes "in_progress"',
    desc: 'task["status"] was hardcoded. Fixed to use the caller-supplied status argument.',
  },
  {
    id: 'D4',
    title: 'Duplicate Validation Logic / Dead Module',
    desc: 'validators.py was unused. Consolidated into is_valid_status() and validate_task_payload(); inline duplicates removed.',
  },
  {
    id: 'D5',
    title: 'Unguarded del Causes HTTP 500 on Delete',
    desc: 'DELETE on a missing task raised KeyError → 500. Now checks existence and returns 404.',
  },
  {
    id: 'D6',
    title: 'Hard-Coded debug=True in Production',
    desc: 'app.config["DEBUG"] = True was hardcoded. Now driven by FLASK_DEBUG env var; default is False.',
  },
  {
    id: 'D7',
    title: 'Insufficient Test Coverage',
    desc: 'Only 3 happy-path tests existed. Expanded to 18 tests covering all endpoints, error paths, and regression cases.',
  },
  {
    id: 'D8',
    title: 'Incomplete README Documentation',
    desc: 'README was a minimal stub. Rewritten with setup, API reference, examples, error table, and architecture diagram.',
  },
];

const WORKFLOW_STAGES = [
  'Baseline Build',
  'Architecture Analysis',
  'Risk Analysis',
  'Test Gap Analysis',
  'Repair Batch 1',
  'Repair Batch 2',
  'Documentation',
  'Verification',
];

const BUSINESS_VALUES = [
  {
    icon: '⚡',
    title: 'Faster Repository Understanding',
    desc: 'Automated architecture analysis maps module responsibilities, dependencies, and data flow in minutes — replacing hours of manual codebase archaeology.',
  },
  {
    icon: '🔧',
    title: 'Structured Defect Repair',
    desc: 'Risk-ranked defect reports surface the highest-impact issues first, enabling targeted repair rather than scattered firefighting. All 8 defects were addressed in two focused repair batches.',
  },
  {
    icon: '🧪',
    title: 'Stronger Test Coverage',
    desc: 'Test count grew from 3 to 18 (500%). Coverage expanded from 3 of 6 endpoints to all 6, with error paths and regression tests for every fixed defect.',
  },
  {
    icon: '📄',
    title: 'Better Developer Documentation',
    desc: 'README rewritten from a minimal stub to a full reference: setup instructions, API endpoint table, request/response examples, error behaviour, and a known-limitations register.',
  },
  {
    icon: '📈',
    title: 'Measurable Repository Improvement',
    desc: 'Repository Health Score improved from 26/100 (Critical) to 91/100 (Excellent) — a +65-point gain backed by evidence at every scored line item.',
  },
];

const VERIFY_ROWS = [
  { metric: 'Total automated tests',        before: '3',              after: '18',              change: '+15' },
  { metric: 'Passing tests',                before: '3',              after: '18',              change: '+15' },
  { metric: 'Failing tests',                before: '0',              after: '0',               change: '0'  },
  { metric: 'Known defects',                before: '8',              after: '0',               change: '−8' },
  { metric: 'Endpoints with test coverage', before: '3 of 6',         after: '6 of 6',          change: '+3' },
  { metric: 'Error-path tests',             before: '0 of 6',         after: '5 of 6',          change: '+5' },
  { metric: 'Global error handlers',        before: '0',              after: '3 (400/404/405)', change: '+3' },
  { metric: 'validators.py used',           before: 'No (dead module)', after: 'Yes',           change: '✓'  },
  { metric: 'Debug mode',                   before: 'Hardcoded True', after: 'Env-driven (default False)', change: '✓' },
  { metric: 'README completeness',          before: 'Minimal stub',   after: 'Full documentation', change: '✓' },
  { metric: 'Verification status',          before: 'FAIL',           after: 'PASS',            change: '✓' },
  { metric: 'Repository health score',      before: '26 / 100',       after: '91 / 100',        change: '+65' },
];

/* ── 2. Animated counter ─────────────────────────────────── */

function animateCount(el, target, duration) {
  const start     = performance.now();
  const from      = 0;
  const isPlus    = el.id && el.id.includes('delta');
  const prefix    = isPlus ? '+' : '';

  function tick(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value    = Math.round(from + (target - from) * eased);
    el.textContent = prefix + value;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

/* ── 3. Intersection observer helper ─────────────────────── */

function onVisible(el, cb) {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          cb();
          obs.disconnect();
        }
      });
    },
    { threshold: 0.2 }
  );
  obs.observe(el);
}

/* ── 4. Build — Score cards ──────────────────────────────── */

function initScoreCards() {
  const sBefore = document.getElementById('score-before');
  const sAfter  = document.getElementById('score-after');
  const sDelta  = document.getElementById('score-delta');

  onVisible(sBefore, () => {
    animateCount(sBefore, SCORE_BEFORE, 1200);
    animateCount(sAfter,  SCORE_AFTER,  1400);
    animateCount(sDelta,  SCORE_DELTA,  1300);
  });
}

/* ── 5. Build — Breakdown bars ───────────────────────────── */

function buildBreakdown() {
  const grid = document.getElementById('breakdown-grid');
  grid.innerHTML = '';

  BREAKDOWN.forEach((row) => {
    const pctBefore = (row.before / row.max) * 100;
    const pctAfter  = (row.after  / row.max) * 100;

    const el = document.createElement('div');
    el.className = 'breakdown-row';
    el.innerHTML = `
      <div class="breakdown-label">${row.label}<br>
        <span style="font-size:0.74rem;color:var(--muted)">${row.before}/${row.max} → ${row.after}/${row.max}</span>
      </div>
      <div class="breakdown-bars">
        <div class="bar-track" title="Before: ${row.before}/${row.max}">
          <div class="bar-fill bar-fill--before" data-pct="${pctBefore}"></div>
        </div>
        <div class="bar-track" title="After: ${row.after}/${row.max}">
          <div class="bar-fill bar-fill--after" data-pct="${pctAfter}"></div>
        </div>
      </div>
      <div class="breakdown-delta">${row.delta}</div>
    `;
    grid.appendChild(el);
  });

  // Animate bars when visible
  onVisible(grid, () => {
    grid.querySelectorAll('.bar-fill').forEach((bar) => {
      bar.style.width = bar.dataset.pct + '%';
    });
  });
}

/* ── 6. Build — Test chips ───────────────────────────────── */

function buildTestGrid() {
  const tBefore = document.getElementById('tests-before');
  const tAfter  = document.getElementById('tests-after');
  const grid    = document.getElementById('test-grid');

  onVisible(tBefore, () => {
    animateCount(tBefore, TESTS_BEFORE, 900);
    animateCount(tAfter,  TESTS_AFTER,  1100);
  });

  grid.innerHTML = '';
  TESTS.forEach((t) => {
    const chip = document.createElement('div');
    chip.className = 'test-chip';
    const dotClass = t.baseline ? 'test-dot--baseline' : 'test-dot--pass';
    chip.innerHTML = `<span class="test-dot ${dotClass}"></span>${t.name}`;
    grid.appendChild(chip);
  });

  // Legend
  const legend = document.createElement('div');
  legend.style.cssText = 'grid-column:1/-1;margin-top:6px;display:flex;gap:18px;font-size:0.78rem;color:var(--muted)';
  legend.innerHTML = `
    <span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--yellow);margin-right:5px;vertical-align:middle"></span>Baseline test (kept)</span>
    <span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--green);margin-right:5px;vertical-align:middle"></span>New test added by Bob</span>
  `;
  grid.appendChild(legend);
}

/* ── 7. Build — Defect cards ─────────────────────────────── */

function buildDefects() {
  const grid = document.getElementById('defect-grid');
  grid.innerHTML = '';
  DEFECTS.forEach((d) => {
    const card = document.createElement('div');
    card.className = 'defect-card';
    card.innerHTML = `
      <div class="defect-id">${d.id}</div>
      <div class="defect-title">${d.title}</div>
      <div class="defect-desc">${d.desc}</div>
      <span class="defect-badge">Fixed</span>
    `;
    grid.appendChild(card);
  });
}

/* ── 8. Build — Workflow stages ──────────────────────────── */

function buildWorkflow() {
  const track = document.getElementById('workflow-track');
  track.innerHTML = '';
  WORKFLOW_STAGES.forEach((name, i) => {
    const step = document.createElement('div');
    step.className = 'workflow-step';
    step.innerHTML = `
      <div class="step-box">
        <span class="step-num">Step ${i + 1}</span>
        <span class="step-name">${name}</span>
      </div>
    `;
    track.appendChild(step);
    if (i < WORKFLOW_STAGES.length - 1) {
      const arrow = document.createElement('span');
      arrow.className = 'step-arrow';
      arrow.textContent = '→';
      track.appendChild(arrow);
    }
  });
}

/* ── 9. Build — Business value ───────────────────────────── */

function buildValue() {
  const grid = document.getElementById('value-grid');
  grid.innerHTML = '';
  BUSINESS_VALUES.forEach((v) => {
    const card = document.createElement('div');
    card.className = 'value-card';
    card.innerHTML = `
      <div class="value-icon">${v.icon}</div>
      <div class="value-title">${v.title}</div>
      <div class="value-desc">${v.desc}</div>
    `;
    grid.appendChild(card);
  });
}

/* ── 10. Build — Verification table ─────────────────────── */

function buildVerifyTable() {
  const table = document.getElementById('verify-table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Metric</th>
        <th>Before Bob</th>
        <th>After Bob</th>
        <th>Change</th>
      </tr>
    </thead>
    <tbody>
      ${VERIFY_ROWS.map((r) => {
        const afterCell = r.metric === 'Verification status'
          ? `<span class="badge-pass">${r.after}</span>`
          : (r.metric.includes('defect') || r.metric.includes('validators') || r.metric.includes('Debug') || r.metric.includes('README'))
            ? `<span class="badge-fixed">${r.after}</span>`
            : r.after;
        const changeCell = ['−8', '+15', '+65'].includes(r.change)
          ? `<strong style="color:var(--green)">${r.change}</strong>`
          : r.change === '0'
            ? `<span style="color:var(--muted)">${r.change}</span>`
            : `<span style="color:var(--green)">${r.change}</span>`;
        return `
          <tr>
            <td>${r.metric}</td>
            <td>${r.before}</td>
            <td>${afterCell}</td>
            <td>${changeCell}</td>
          </tr>`;
      }).join('')}
    </tbody>
  `;
}

/* ── 11. Init ────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initScoreCards();
  buildBreakdown();
  buildTestGrid();
  buildDefects();
  buildWorkflow();
  buildValue();
  buildVerifyTable();
});
