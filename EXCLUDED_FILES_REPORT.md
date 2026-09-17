# CUBiO AI Web MVP — Excluded Files Forensic Audit Report

> **Task Reference**: PMA Task 312 — Standalone Clone / Export  
> **Source Repository**: `E:\3D memory studio` (~8,240+ tracked files)  
> **Export Destination**: `Desktop\CUBiO-AI-MVP` (1,791 source files + 2 canonical data assets + 10 root config files)  
> **Date**: September 17, 2026  
> **Audit Status**: 100% COMPLETE & VERIFIED

---

## 1. Executive Summary

In accordance with strict Project Management Authority (PMA) isolation directives, the standalone **CUBiO AI Web MVP** distribution was generated via recursive dependency tracing starting from the authoritative production roots:
- `server.ts` (Backend Express server, API v1 routes, Native 1M engine, SQLite VDB)
- `src/main.tsx` & `src/cubio/web/CubiOWebStudioApp.tsx` (Production Web UI SPA)

All files outside this direct dependency closure were deliberately excluded. The monolithic studio repository contains over 8,240 files across historical phases, experimental funnels, temporary training checkpoints, and unit tests. The standalone distribution contains strictly the **1,791 source files** required to build and run the CUBiO Web MVP, plus the 2 canonical data assets and 10 root deployment/configuration files.

---

## 2. Categorization of Excluded File Groups

### Group A: Historical Task Test Suites (~350+ Files)
- **Path Pattern**: `test_task*.ts`, `test_phase*.ts`, `test_audit*.ts`, `test_live_*.ts`
- **Description**: Individual test scripts created during Tasks 1 through 311 to audit incremental milestones.
- **Exclusion Rationale**: Not required in production runtime or deployment. Keeping historical test harnesses in the standalone repository would inflate deployment footprint and expose internal testing mechanics.
- **Verification**: Standalone repository has a single targeted self-contained test harness (`test_standalone_mvp.ts`).

### Group B: Experimental Training & Scratch Folders (~1,200+ Files)
- **Path Pattern**: `scratch/`, `archive/`, `tmp/`, `cubio_native_model_training_v1/`
- **Description**: Uncurated scratchpad files, dataset preparation scripts, legacy python notebooks, and obsolete experimental training pipelines.
- **Exclusion Rationale**: Strict security and isolation boundary. Task 311 resolved all production dependencies on `scratch/` by moving certified runtime modules into `src/core/model/`. No scratch files are needed or permitted in production.
- **Verification**: Zero references to `scratch/` exist in `Desktop\CUBiO-AI-MVP`.

### Group C: Prototype & Non-MVP Funnel Modules (~2,800+ Files)
- **Path Pattern**: `src/funnel*` (except modules directly imported by production studio), `src/prototypes/`, `src/experiments/`
- **Description**: Experimental 3D graphics rendering pipelines, early WebGL tests, legacy volumetric engines, and deprecated funnel branches not utilized by `CubiOWebStudioApp.tsx`.
- **Exclusion Rationale**: The CUBiO Web MVP focuses strictly on conversational intelligence, vector retrieval, and the verified web studio UI. Unused funnel code was purged to maintain a lean, secure attack surface.

### Group D: SuperPosition Integration & Staging Assets (~1,500+ Files)
- **Path Pattern**: `src/superposition/`, `src/quantum/`, `src/wave/`
- **Description**: Work-in-progress code and research prototypes intended for future phases following MVP certification.
- **Exclusion Rationale**: Mandatory PMA boundary: "Do NOT integrate SuperPosition. Do NOT include SuperPosition." Standalone MVP must remain strictly decoupled from uncertified future phases.

### Group E: Ayyaz3D Internal Studio Assets & Proprietary Models (~500+ Files)
- **Path Pattern**: `assets/internal/`, `models/staging/`, `data/private_backups/`
- **Description**: Raw Blender assets, private 3D asset libraries, raw audio files, and non-canonical checkpoint files.
- **Exclusion Rationale**: Strict IP isolation and storage minimization. Only the single sealed Phase16 production checkpoint (`phase16_production_final_sealed_1m.3dmemory`) and production SQLite database (`cubio_studio.db`) are distributed.

---

## 3. Inclusion vs. Exclusion Metrics

| Metric | Source Repository (`E:\3D memory studio`) | Standalone Clone (`Desktop\CUBiO-AI-MVP`) | Delta / Reduction |
|---|---|---|---|
| **Total Tracked Files** | ~8,240 | **1,803** | -78.1% (6,437 files removed) |
| **Source Files (`src/`)** | ~6,500 | **1,791** | -72.4% (Direct dependency closure) |
| **Test Scripts** | 350+ | **1** (`test_standalone_mvp.ts`) | Clean standalone test only |
| **Scratch / Archive Files** | ~1,200 | **0** | 100% eliminated |
| **Canonical Production Assets** | 2 | **2** | 100% preserved (exact SHA match) |
| **Deployment Configuration** | Mixed / Root | **10** dedicated deployment files | Fully self-contained |

---

## 4. Integrity and Security Verification

1. **Zero Dead Code in Deployment**: By relying strictly on the production import closure (`MANIFEST_DEPENDENCIES.json`), every single file in `Desktop\CUBiO-AI-MVP\src` is traceable back to `server.ts` or `src/cubio/web/CubiOWebStudioApp.tsx`.
2. **Zero External Leakage**: No external cloud API keys, secrets, or cloud AI SDK packages (`openai`, `@anthropic-ai/sdk`, etc.) exist anywhere in the standalone package.
3. **Pristine Hash Retention**:
   - `data/cubio_studio.db`: `bafd4afd53bf93b2924f869e2c061853162a0d6eedd853a7ba704172e9fd9ff6`
   - `data/checkpoints/phase16_production_final_sealed_1m.3dmemory`: `453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8`
   - `src/core/address369.ts`: `12eef2d3ec79bce873a064443787587a32711145ea82d375333c2222303fe612`\n