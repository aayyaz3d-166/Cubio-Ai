# CUBiO AI — 3D Memory Studio
# Task 27: Native Project Manager Agent (PMA) Architecture

**Document ID:** `CUBIO-PMA-ARCH-V1`  
**Location:** `src/cubio/language/native/pma/`  
**Sovereign Baseline:** 100% Offline Native Execution  
**Hardware Safety Invariant:** `is_actuation_blocked = true` (IMMUTABLE)  

---

## 1. Architectural Mission & Role

The **Native Project Manager Agent (PMA)** is the authoritative project-intelligence, pre-development gatekeeping, and post-development verification orchestrator within the CUBiO AI 3D Memory Studio repository.

```
USER PROMPT
    ↓
PMA (Pre-Development Gate)
    ↓
TASK PARSING & UNDERSTANDING
    ↓
TARGETED EXPLORATION (Master Forensic Index)
    ↓
CAPABILITY RESOLUTION (REUSE -> COMPOSE -> EXTEND -> NEW)
    ↓
DEPENDENCY TRACE & PREVIOUS WORK CONTINUITY
    ↓
FROZEN BASELINE & SOVEREIGNTY SAFETY CHECK
    ↓
DEVELOPER HANDOFF CONTRACT (Allowed vs Protected Boundaries)
    ↓
DEVELOPMENT IMPLEMENTATION
    ↓
TESTING & REGRESSION AUDIT
    ↓
PMA FINAL REVIEW (9 Mandatory Questions)
    ↓
PROJECT MEMORY (Cryptographic Provenance Record)
```

### Critical Architectural Bounds
- **PMA is NOT a new LLM.** It introduces zero external transformer weights, cloud inference APIs, or prompt-wrapper models.
- **PMA is NOT a generic chatbot.** It is a deterministic software orchestration engine.
- **PMA does not create a parallel One Language architecture.** Forensic discovery proved that One Language execution canonically resides in `src/cubio/language/native/`. PMA integrates directly at `src/cubio/language/native/pma/`.

---

## 2. Core Subsystem Breakdown

| Module | Location | Purpose |
|---|---|---|
| **PMA Types** | `types.ts` | Authoritative interfaces for requests, handoff contracts, inspections, reviews, and task records |
| **Project Navigator** | `projectNavigator.ts` | Master Forensic Index navigation layer; routes scoped tasks without scanning 26,605+ artifacts |
| **Capability Resolver** | `capabilityResolver.ts` | Resolves existing engines; enforces REUSE -> COMPOSE -> EXTEND -> NEW; flags duplicate engines |
| **Frozen Protection Guard** | `frozenProtectionGuard.ts` | Protects `address369.ts`, `data/cubio_studio.db`, Phase 8 components; verifies Formula A math |
| **Sovereignty Safety Guard** | `sovereigntySafetyGuard.ts` | Enforces 0 external AI APIs; discriminates benign static test strings; locks hardware actuation |
| **PMA Planner** | `pmaPlanner.ts` | Pre-development gate; scope parsing; derives allowed files; computes deterministic SHA-256 handoff hash |
| **Post-Dev Verifier** | `postDevelopmentVerifier.ts` | Audits git diff against allowed boundary; verifies disk hashes; conducts 9-point Final Project Review |
| **Project Memory** | `projectMemory.ts` | Cryptographic SHA-256 task ledger maintaining complete engineering provenance |
| **Master Orchestrator** | `projectManagerAgent.ts` | High-level API coordinating pre-development, handoff, verification, and end-to-end Golden Path |

---

## 3. Targeted Navigation Architecture (Master Forensic Index)

To maintain high project awareness without incurring prohibitive I/O overhead on every request:
1. **Master Forensic Index (`MASTER_INDEX.md`, `README_MASTER_INDEX.md`, `MASTER_PROJECT_MAP.md`)**: Acts as a static in-memory navigation routing directory.
2. **Normal Development Requests**: Scoped to affected subsystems via keyword specificity scoring. Only relevant files and tests are loaded.
3. **Full Repository Sweeps**: Triggered strictly on designated architectural boundaries:
   - `ARCHITECTURAL` tasks (broad structural modifications)
   - `CROSS_SUBSYSTEM` tasks (multimodal fusion, perception-to-cognition)
   - `SECURITY` audits (cryptographic & external AI scans)
   - `MIGRATION` tasks (schema & format upgrades)
   - `UNKNOWN` / ambiguous requests (fail-closed full scope verification)
   - Explicit caller request (`explicitFullProjectScan = true`)

---

## 4. Protected Baselines & Invariant Preservation

PMA monitors and enforces permanent immutability on:
1. **Spatial Core 369 Authority**: `src/core/address369.ts`
   - Pure Formula A: $cellId = x + 7y + 49z$ ($x,y,z \in [0,6]$), $address369 = 26 + cellId$ ($cellId \in [0,342]$, $address369 \in [26, 368]$).
   - $\Delta = 0$, bitwise identical.
2. **Canonical Sparse Memory VDB**: `data/cubio_studio.db`
   - Size: 77,824 bytes, SHA-256: `E8CB4147DD1DCF73B29FB0EF270B75EFD3B93598F3130D0625F9ED4A0DF2C493`.
   - Silent database mutations trigger instant `DATABASE_MUTATION_RISK` conflict and execution block.
3. **Phase 8 Certified Subsystems**:
   - Cryptographically locked in `phase8_baseline_manifest.json` (11 certified subsystem files).
   - Verified by `src/test_phase8_regression_lock.ts`.
4. **Hardware Actuation Lockout**:
   - `is_actuation_blocked = true` inherited permanently. Physical actuator commands are rejected fail-closed.
