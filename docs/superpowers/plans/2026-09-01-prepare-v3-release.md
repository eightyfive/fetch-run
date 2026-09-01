# v3 Release Preparation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the v3 package reproducible from a clean checkout and document its stable release and subscription semantics.

**Architecture:** Keep subscriptions asynchronous and independent of request promises. Package creation invokes the existing TypeScript build through an npm lifecycle hook, while compilation excludes test sources from `dist`.

**Tech Stack:** npm lifecycle scripts, TypeScript 4.6, Jest 28, Markdown.

---

## File structure

- Modify: `package.json` — stable version and package lifecycle build.
- Modify: `tsconfig.json` — exclude test files from emitted output.
- Modify: `README.md` — asynchronous subscriber semantics.
- Create: `CHANGELOG.md` — v3 migration notes.

### Task 1: Make package creation reproducible

**Files:**

- Modify: `package.json:3-10`
- Modify: `tsconfig.json:45-50`

- [x] **Step 1: Confirm the current packaging gap**

Run: `npm pack --dry-run`

Expected: the clean package omits `dist/` even though package entry points reference it.

- [x] **Step 2: Add stable version and package build hook**

Set `version` to `3.0.0` and add the script:

```json
"prepack": "npm run build"
```

- [x] **Step 3: Exclude tests from emitted distribution files**

Add `"**/*.test.ts"` to the TypeScript `exclude` array.

- [x] **Step 4: Verify package contents**

Run: `npm pack --dry-run`, `yarn test --runInBand`, and `./node_modules/.bin/tsc --project . --noEmit`.

Expected: runtime `dist` files are packaged, no compiled tests are packaged, Jest passes, and TypeScript type-checks.

### Task 2: Document v3 accurately

**Files:**

- Create: `CHANGELOG.md`
- Modify: `README.md:108-113`

- [x] **Step 1: Add the v3 changelog**

Document removed resource helpers, removed clone and error APIs, `URLSearchParams` search inputs, bearer-header clearing, subscriber response data, error-response subscriptions, logger timing, and the v3 documentation rewrite.

- [x] **Step 2: Correct subscription timing documentation**

Explain that subscriber notifications are asynchronous and do not delay or alter the request result.

- [x] **Step 3: Verify documentation quality**

Run: `git diff --check` and `rg -n 'before the request is rethrown' README.md CHANGELOG.md`.

Expected: no whitespace errors and no obsolete timing claim.

### Task 3: Commit and open the requested pull request

**Files:**

- Verify: `package.json`, `tsconfig.json`, `README.md`, `CHANGELOG.md`

- [x] **Step 1: Run release verification**

Run: `yarn test --runInBand`, `yarn build`, `npm pack --dry-run`, `git diff --check`, and `git status --short`.

Expected: tests and build pass; the package includes runtime `dist` files but no compiled tests; only planned files are changed.

- [ ] **Step 2: Commit and create the PR**

Commit with `chore: prepare v3 release`, then create a pull request from `codex/prepare-v3-release` into `v3`.
