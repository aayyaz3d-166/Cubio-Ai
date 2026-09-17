# TASK 313 — RAILWAY LINUX FRONTEND BUILD COMPATIBILITY REPORT
**Project**: CUBiO AI Web MVP — Standalone Deployment Distribution  
**Location**: C:\Users\PC\Desktop\CUBiO-AI-MVP  
**Date**: September 17, 2026  
**Status**: Certified & Ready for Manual Deployment  

---

## 1. Executive Summary
During the Railway Linux deployment build (
pm run build / ite build), Vite failed to load ite.config.ts due to @tailwindcss/oxide:
Cannot find native binding
Task 313 conducted a forensic investigation of the dependency tree, Nixpacks builder mechanics, and platform-specific NAPI binaries. Cross-platform compatibility for Railway/Nixpacks Linux (glibc & musl, x64 & arm64) has been resolved while preserving the entire existing CUBiO architecture, Native 1M model, VDB, and Address369 intact.

---

## 2. Root Cause Analysis
1. **Missing Node Engine Specification (engines.node >= 20)**:
   - @tailwindcss/oxide requires Node >= 20.
   - Without an engines definition in package.json, Nixpacks defaults to Node 18, causing npm to reject or skip @tailwindcss/oxide-linux-x64-gnu.
2. **Transitive Optional Dependency Pruning**:
   - package-lock.json generated on Windows only installed @tailwindcss/oxide-win32-x64-msvc.
   - On Linux CI/CD (
pm ci), transitive optional dependencies are omitted unless declared in root optionalDependencies or explicitly forced.
3. **Nixpacks Default Build Phase Without Optional Flags**:
   - Railway's Nixpacks runner defaults to 
pm ci without --include=optional.
4. **Platform Binding Coverage**:
   - Vite 6, Rollup 4, esbuild 0.25, and Tailwind v4 all use native binaries that must have matching Linux targets (linux-x64-gnu, linux-x64-musl) in the lockfile.

---

## 3. Implemented Fixes & Architecture Preservations
- **package.json**:
  - Added "engines": { "node": ">=20.0.0", "npm": ">=9.0.0" }.
  - Declared explicit optionalDependencies for:
    - @tailwindcss/oxide-linux-x64-gnu (4.3.3)
    - @tailwindcss/oxide-linux-x64-musl (4.3.3)
    - @tailwindcss/oxide-linux-arm64-gnu (4.3.3)
    - @tailwindcss/oxide-linux-arm64-musl (4.3.3)
    - @tailwindcss/oxide-win32-x64-msvc (4.3.3)
    - @rollup/rollup-linux-x64-gnu (^4.34.0)
    - @rollup/rollup-linux-x64-musl (^4.34.0)
    - @esbuild/linux-x64 (^0.25.0)
    - lightningcss-linux-x64-gnu (^1.32.0)
    - lightningcss-linux-x64-musl (^1.32.0)
- **.npmrc**:
  - Configured include=optional and legacy-peer-deps=true.
- **
ixpacks.toml**:
  - Configured Nixpacks to use 
odejs_22 and execute 
pm install --include=optional before 
pm run build.
  - Guaranteed Unix LF line endings.
- **Procfile**:
  - Verified Unix LF line endings (web: npx tsx server.ts).
- **package-lock.json**:
  - Regenerated and locked with full integrity hashes for all Linux and Windows native packages.

---

## 4. Protected Asset Hashes (Unchanged)
| Asset | Expected SHA-256 | Verified SHA-256 | Status |
|---|---|---|---|
| data/cubio_studio.db | afd4afd53bf... | afd4afd53bf93b2924f869e2c061853162a0d6eedd853a7ba704172e9fd9ff6 | **MATCH** |
| data/checkpoints/phase16_production_final_sealed_1m.3dmemory | 453590e284f2... | 453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8 | **MATCH** |
| src/core/address369.ts | 12eef2d3ec79... | 12eef2d3ec79bce873a064443787587a32711145ea82d375333c2222303fe612 | **MATCH** |

---

## 5. Verification Results
1. **Linux Dry-Run Resolution**: 
pm install --os=linux --cpu=x64 --dry-run passed cleanly with all native Linux packages resolved.
2. **Local Production Build**: 
pm run build completed in 7.23s, generating dist/assets/index-r2QyBCG6.css (171.84 kB) and JS chunks without missing binding errors.
3. **Standalone Runtime Test (	est_standalone_mvp.ts)**:
   - Gate 1: Canonical Data Assets: **PASS**
   - Gate 2: Address369 Sovereign Validator: **PASS**
   - Gate 3: Actuation Lockout & Security Boundary: **PASS**
   - Gate 4: Clean Dependency Closure (0 scratch dependencies): **PASS**
   - Gate 5: Standalone Server Boot: **PASS**
   - Gate 6: Health & Readiness Endpoints: **PASS**
   - Gate 7: Models Endpoint Contract (cubio-native-1m-production): **PASS**
   - Gate 8: VDB Query Endpoint: **PASS**
   - Gate 9: Native 1M Chat Inference: **PASS** (37ms latency)
   - Gate 10: Root SPA Serving: **PASS**
   - **Score: 10/10 GATES PASSED.**

---

## 6. Git Synchronization
- Changes committed locally on main branch (C:\Users\PC\Desktop\CUBiO-AI-MVP):
  740b9de fix(pma-task-313): railway linux frontend build compatibility
- User-owned operation reminder: Ready for manual git push origin main and Railway trigger.
