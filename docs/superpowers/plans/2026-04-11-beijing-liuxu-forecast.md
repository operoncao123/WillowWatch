# Beijing Liuxu Forecast Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, mobile-friendly web page that fetches Beijing weather from Open-Meteo and shows today/tomorrow willow catkin risk with a simplified GDD model.

**Architecture:** Keep the project as a dependency-free static site with three public files: `index.html`, `style.css`, and `script.js`. Put all forecast math in pure JavaScript helper functions so the UI logic can stay small and the algorithm can be verified with Node's built-in test runner.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript (ES6), Open-Meteo forecast API, Node `--test` for local no-dependency verification

---

## Chunk 1: Project Skeleton And Verification Hooks

### Task 1: Add the first failing tests for the forecast model

**Files:**
- Create: `tests/script.test.js`
- Create: `script.js`

- [ ] **Step 1: Write the failing test**
Write tests for `computeGdd`, `computeRiskIndex`, and `getRiskLevel`.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test`
Expected: FAIL because `script.js` does not exist yet.

- [ ] **Step 3: Write minimal implementation**
Export the forecast helpers from `script.js` without DOM access at module load time.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test`
Expected: PASS for the helper tests.

## Chunk 2: Static Page And Responsive Layout

### Task 2: Add the HTML shell and card-based layout

**Files:**
- Create: `index.html`
- Modify: `style.css`

- [ ] **Step 1: Add semantic page sections**
Include header, loading/status area, two forecast cards, and footer info blocks.

- [ ] **Step 2: Add mobile-first responsive styles**
Use CSS variables, grid/flex layout, and risk color states for low/medium/high.

## Chunk 3: Data Fetch, Fallback, And Rendering

### Task 3: Implement weather fetching and UI updates

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Build the Open-Meteo request**
Request current, hourly, and daily fields for Beijing in `Asia/Shanghai`.

- [ ] **Step 2: Transform API data into UI-ready snapshots**
Produce today/tomorrow objects with temperature, humidity, wind, precipitation, GDD, risk index, level, and advice.

- [ ] **Step 3: Add fallback behavior**
Show friendly degraded-state messaging and a Beijing spring default dataset on request failure or timeout.

- [ ] **Step 4: Render and hydrate the DOM**
Update all visible values, timestamps, and data-source labels.

## Chunk 4: Documentation And Final Verification

### Task 4: Add usage notes and run final checks

**Files:**
- Create: `README.md`
- Verify: `index.html`
- Verify: `style.css`
- Verify: `script.js`

- [ ] **Step 1: Document local preview and GitHub Pages deployment**
Summarize the structure, algorithm, and deployment steps.

- [ ] **Step 2: Run verification**
Run: `node --test`
Expected: PASS.

- [ ] **Step 3: Run a static sanity check**
Run: `node -e "const fs=require('fs'); ['index.html','style.css','script.js'].forEach(f=>fs.accessSync(f))"`
Expected: exit 0.
