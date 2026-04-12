# Beijing Liuxu Multisource Media Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the current single-city static page into a Beijing 16-district media-style forecast app with a Node backend that aggregates weather, ecology, and social signals.

**Architecture:** Keep the frontend as a dependency-light static site and add a Node API service that computes per-district risk snapshots. Model logic lives in small backend modules that can be tested with Node's built-in test runner, and the frontend consumes a single aggregated overview endpoint.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Node.js, Open-Meteo, optional provider-based social scrapers

---

## Chunk 1: Backend Risk Model

### Task 1: Add failing tests for district scoring

**Files:**
- Create: `backend/tests/risk-engine.test.js`
- Create: `backend/src/lib/risk-engine.js`
- Create: `backend/src/data/districts.js`

- [ ] **Step 1: Write the failing test**
Cover ecology weighting, social boost limiting, and district sorting.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test backend/tests/risk-engine.test.js`
Expected: FAIL because backend modules do not exist yet.

- [ ] **Step 3: Write minimal implementation**
Create district config and risk-engine helpers.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test backend/tests/risk-engine.test.js`
Expected: PASS.

## Chunk 2: Backend Aggregation API

### Task 2: Add overview API and data services

**Files:**
- Create: `backend/src/server.js`
- Create: `backend/src/lib/weather-service.js`
- Create: `backend/src/lib/ecology-service.js`
- Create: `backend/src/lib/social-service.js`
- Create: `backend/src/lib/social/providers/xiaohongshu.js`
- Create: `backend/src/lib/social/providers/weibo.js`
- Create: `package.json`

- [ ] **Step 1: Write failing API tests**
Test the overview payload shape and fallback behavior.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test backend/tests/api.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement the overview endpoint**
Serve `/api/overview` with district list, ranking, selected district, and social items.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test backend/tests/api.test.js`
Expected: PASS.

## Chunk 3: Frontend Rebuild

### Task 3: Replace the current utility layout with a media page

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `script.js`

- [ ] **Step 1: Add failing UI-state tests**
Cover view-model formatting helpers used by the frontend.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/frontend.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement the new page**
Add hero poster, district matrix, district detail, and social card rendering.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/frontend.test.js`
Expected: PASS.

## Chunk 4: Integration And Docs

### Task 4: Document startup and run verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document frontend/backend startup**
Add local run instructions, env vars, and deployment notes.

- [ ] **Step 2: Run verification**
Run: `node --test`
Expected: PASS.

- [ ] **Step 3: Run a live overview smoke test**
Run: `node backend/src/server.js`
Expected: API starts and returns JSON from `/api/overview`.
