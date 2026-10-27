# Documentation and Dependency Synchronization Plan

A comprehensive plan to reconcile project documentation, Docker configuration references, feature claims, and package dependencies in Econosmishu based on empirical codebase verification.

## User Review & Critical Decisions

> [!IMPORTANT]
> Both open decisions have been confirmed by the user in Phase 1:
> - **Export & Import Feature**: Removed from `README.md` to accurately represent current functionality rather than documenting unimplemented features.
> - **`@google/genai` Dependency**: Uninstalled and removed from `package.json` as Econosmishu does not use LLM features or AI models.

- **Confirmed Decision 1**: Remove the phantom `Export & Import` bullet point from `README.md`.
- **Confirmed Decision 2**: Remove `@google/genai` from `package.json` dependencies and update lockfiles.
- **Confirmed Decision 3**: Align `AGENTS.md` line 26 from `Node 22-alpine` to `Node 22-slim` to match the actual multi-stage `Dockerfile`.
- **Confirmed Decision 4**: Replace `lint_applet` and `compile_applet` in `AGENTS.md` line 407 with the real project commands `npm run lint` and `npm run build`.

---

## 1. Overview & Core Concept

During code and documentation review, four discrepancies were identified between the documentation (`AGENTS.md`, `README.md`), the build environment (`Dockerfile`), and the runtime dependencies (`package.json`):

1. **Verification Tooling Discrepancy**: `AGENTS.md` instructed agents to run `lint_applet` and `compile_applet`. In standard developer workflows, the actual commands are `npm run lint` (`tsc --noEmit`) and `npm run build` (`vite build && esbuild`).
2. **Docker Base Image Contradiction**: `Dockerfile` uses `node:22-slim` in both build and runtime stages to leverage Debian glibc prebuilt binaries for `better-sqlite3`. While `AGENTS.md` line 399 documents `node:22-slim`, line 26 mistakenly referenced `Node 22-alpine`.
3. **Phantom Feature in README**: `README.md` advertised an `Export & Import` feature that does not exist in the codebase.
4. **Dead Dependency in `package.json`**: `@google/genai` was listed as an installed dependency (`^1.52.0`), but is never imported or utilized anywhere in the application.

This plan synchronizes all files into a unified, accurate state.

---

## 2. User Experience & Visual Design

This task focuses on documentation precision, developer onboarding clarity, and dependency hygiene. The user-facing application UI (React SPA, financial dashboards, Recharts visualizations, and account modals) remains intact and unaffected by these changes.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Remove phantom feature documentation vs. implementing Export/Import
- *Chosen Approach*: Remove the line from `README.md`.
- *Why*: The user selected removing the claim to maintain immediate truthfulness between docs and code without introducing scope bloat or unneeded endpoints.
- *Alternative Considered*: Implementing full JSON export and restore API endpoints and UI modals; rejected per user choice.

### Decision 2: Dockerfile image standardization
- *Chosen Approach*: Standardize `AGENTS.md` documentation to `node:22-slim`.
- *Why*: `better-sqlite3` requires glibc for fast native precompiled binary installation. Using Alpine would require heavy build dependencies (`python3`, `make`, `g++`) and slow down container builds significantly.

### Decision 3: Remove unused `@google/genai`
- *Chosen Approach*: Remove from `package.json` and prune lockfiles.
- *Why*: Eliminates ~15MB of dead dependencies in `node_modules`, speeds up `npm install`, and eliminates confusion for future developers and auditing tools.

---

## 4. Technical Architecture & Data Strategy

### System Alignment Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          ECONOSMISHU REPO                              │
└────────────────────────────────────────────────────────────────────────┘
          │                                              │
          ▼                                              ▼
┌───────────────────────────┐                ┌───────────────────────────┐
│     DOCUMENTATION         │                │     SYSTEM ARTIFACTS      │
├───────────────────────────┤                ├───────────────────────────┤
│ AGENTS.md:                │                │ Dockerfile:               │
│ - Line 26: node:22-slim   │ ──matches────> │ - node:22-slim (glibc)    │
│ - Line 407: npm run lint  │                │                           │
│   & npm run build         │                │ package.json:             │
│                           │                │ - scripts: lint, build    │
│ README.md:                │                │ - remove @google/genai    │
│ - Remove Export & Import  │ ──matches────> │                           │
└───────────────────────────┘                └───────────────────────────┘
```

### Action Plan by File:

1. **`AGENTS.md`**:
   - Update line 26: Change `(using Node 22-alpine)` to `(using Node 22-slim)`.
   - Update line 407: Replace `Call lint_applet followed by compile_applet...` with `Run npm run lint (tsc --noEmit) followed by npm run build (vite build and esbuild server bundle) to check that the application compiles and types are sound.`

2. **`README.md`**:
   - Remove line 15: `- **Export & Import**: Backup and restore transaction data and account structures effortlessly.`

3. **`package.json`**:
   - Remove line 17: `"@google/genai": "^1.52.0",` using `replace_file_content`.

4. **Lockfile & Validation**:
   - Run `npm install` (via `install_applet_dependencies` or `run_command`) to clean up lockfile.
   - Run `npm run lint` and `npm run build` to verify the codebase builds cleanly without any errors.
