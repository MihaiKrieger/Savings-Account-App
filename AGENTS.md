# Econosmishu Project Rules & Context

## Versioning Policy
- **Functional Changes / Bug Fixes**: Increment the version number in the `package.json` and footer by `0.0.1`.
- **Major New Features**: Increment the version number by `0.1.0`.
- **Baseline**: Version `1.7.0` is considered the absolute baseline for this project.

## Application Architecture
- **Name**: Econosmishu
- **Description**: A modern web application to track multiple savings accounts, manage transactions, and visualize financial growth across different currencies and banks.
- **Stack**: 
    - Frontend: React 18+, Vite, Tailwind CSS (v4), Motion (for animations).
    - Backend: Express.js (serving as a proxy for Gemini and potentially other services).
    - Database: SQLite (via `better-sqlite3`).
    - AI: Google Gemini API (integrated server-side).

## Design Philosophy
- Use **Inter** for UI and **JetBrains Mono** for financial data/codes.
- Styling is handled via Tailwind CSS v4.
- Icons are strictly from `lucide-react`.

## Current State
- The app is set up as a full-stack application with a custom `server.ts`.
- Build process bundles the server using `esbuild` into `dist/server.cjs`.
- Linter and type-checking are configured and passing as of v1.7.0.
