# CUBiO AI — 3D Memory Studio
# Task 27: Native Project Manager Agent (PMA) Task Protocol

**Document ID:** `CUBIO-PMA-PROTOCOL-V1`  
**Location:** `src/cubio/language/native/pma/`  
**Enforcement Level:** MANDATORY PRE-DEVELOPMENT & POST-DEVELOPMENT GATE  

---

## 1. The Mandatory 13 Pre-Development Questions

Before writing a single line of code, PMA must answer:

1. **What exactly does the user want?**  
   Parsed from prompt intent into structured objective.
2. **Which subsystem is affected?**  
   Classified into one or more registered CUBiO subsystems.
3. **Which files are relevant?**  
   Discovered via Master Forensic Index navigation lookup.
4. **Does the capability already exist?**  
   Matched against `reports/forensic/MASTER_CAPABILITY_MAP.csv` and `reports/3D_MEMORY_STUDIO_TOOL_REGISTRY.csv`.
5. **Can existing code be reused?**  
   Evaluated under `REUSE` -> `COMPOSE` -> `EXTEND` -> `NEW` discipline.
6. **What dependencies are involved?**  
   Traced via module dependency graph.
7. **What previous tasks/results are relevant?**  
   Retrieved from `reports/tasks/` and historical lineage.
8. **Is any frozen subsystem affected?**  
   Verified against `phase8_baseline_manifest.json` and protected file registry.
9. **Is the database affected?**  
   Categorized as `DATABASE_READ_ONLY` or `DATABASE_MODIFICATION_REQUIRED`.
10. **Is 369 affected?**  
    Categorized as `NO_IMPACT`, `READ_CANONICAL_MATH`, or `BLOCKED_MODIFICATION`.
11. **What files are actually allowed to change?**  
    Explicit `ALLOWED FILES` boundary generated.
12. **What tests are required?**  
    Targeted subsystem test suites + regression lock suite.
13. **What regression checks are required?**  
    `src/test_phase8_regression_lock.ts` 16/16 verification gates.

---

## 2. Pre-Development Gate Sequence

```
[1] User Request
       │
       ▼
[2] Task Parsing & Classification
       │
       ▼
[3] Scope Identification
       │
       ▼
[4] Master Project Map Lookup (Targeted Navigation)
       │
       ▼
[5] Existing Capability Resolution (Anti-Duplication)
       │
       ▼
[6] Dependency & Continuity Trace
       │
       ▼
[7] Frozen Baseline & Sovereignty Audit
       │
       ▼
[8] Generate PMA Developer Handoff Contract
       │
       ▼
[9] Approval Gate: If conflicts exist -> STOP / REFUSE
```

---

## 3. Post-Development Verification Sequence

```
[1] Collect Developer Changes (git status / git diff)
       │
       ▼
[2] Boundary Audit: Are any files outside ALLOWED FILES?
       │   └── YES -> REJECT with BOUNDARY_VIOLATION
       │
       ▼
[3] Frozen Invariant Audit: Were any protected files touched?
       │   └── YES -> REJECT with FROZEN_COMPONENT_CONFLICT
       │
       ▼
[4] Physical Disk Verification: DB size (77,824 B) & SHA-256 bitwise check
       │
       ▼
[5] Spatial 369 Authority: Formula A invariants bitwise check
       │
       ▼
[6] Sovereignty & Actuation Audit: 0 external AI runtime calls, actuation locked
       │
       ▼
[7] Automated Test & Regression Suite Execution
       │
       ▼
[8] PMA Final Review (9 Mandatory Questions)
       │
       ▼
[9] Project Memory Recording & Final Verdict Delivery
```
