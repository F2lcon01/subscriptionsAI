# Error Governance v0.1 — Living Bug Ledger

## ERR-001

- **Date (Asia/Riyadh)**: 2026-02-22T03:50:13+03:00
- **Location**: Terminal (`node` / `pwsh`)
- **Root Cause**: The global command `firebase` is not recognized by PowerShell after `npm install -g firebase-tools` because the global npm scripts directory is not in the system's `PATH`.
- **Impact**: Unable to authenticate with Firebase using `firebase login` or list projects.
- **Solution Steps**:
  1. Use `npx firebase-tools` (or `npx firebase`) instead of relying on the globally installed `firebase` binary OR
  2. Add the npm global directory to the environment Variables `PATH`.
- **Future Guard**: Always fallback to `npx firebase ...` or verify `PATH` environments before assuming global npm packages will execute correctly on Windows.
- **Status**: Fixed
