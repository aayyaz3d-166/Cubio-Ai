# CUBiO AI — 3D Memory Studio
# Task 28: Persistent Project Change Watcher Specification

**Document ID:** `CUBIO-PMA-CHANGE-WATCHER-V1`  
**Location:** `src/cubio/language/native/pma/`  
**Integration Base:** Extended from Task 27 Native PMA  
**Operating Mode:** Read-Only Observation + Verified Change Recording  
**Hardware Safety Invariant:** `is_actuation_blocked = true` (PERMANENT)  

---

## 1. Architectural Role & Boundary

The **Persistent Project Change Watcher** (`ProjectChangeWatcher`) is a lightweight, non-invasive observation extension of the Task 27 Native Project Manager Agent (PMA).

```
PROJECT BASELINE (Lightweight Subsystem Metadata)
      ↓
FILE CHANGE OBSERVATION (Targeted metadata & lazy hashing)
      ↓
CHANGE DETECTION (New, Modified, Deleted, Renamed, Hash, Size)
      ↓
CHANGE CLASSIFICATION (12 Formal Categories)
      ↓
PMA SCOPE CHECK (In-Scope vs Out-of-Scope vs Unassociated)
      ↓
PROTECTED FILE CHECK (address369, cubio_studio.db, Phase 8)
      ↓
DEPENDENCY IMPACT (Downstream imports, tests, config, VDB)
      ↓
PROJECT MEMORY RECORD (Cryptographic Change Event Ledger)
```

### Critical Architecture Bounds
1. **Single PMA Architecture:** No secondary Project Manager, parallel scanner, or separate memory store was created.
2. **Lightweight Observation (No 26k Rescan):** Does not continuously traverse all 26,605+ repository artifacts. Instead, it tracks targeted subsystem metadata (`fs.statSync`), performs lazy SHA-256 computation, and relies on the Master Forensic Index.
3. **No Automatic Revert Invariant:** Unexpected or unauthorized changes are never deleted, reverted, or overwritten. PMA strictly reports:
   $$\text{DETECT} \rightarrow \text{CLASSIFY} \rightarrow \text{ALERT} \rightarrow \text{RECORD} \rightarrow \text{REQUEST REVIEW}$$
4. **Honest Host Capability Reporting:** Clearly reports that host-level global conversation interception is not available without a platform process hook.

---

## 2. Change Classification Scheme

Every detected filesystem change is assigned exactly one of 12 authoritative categories:

| Classification | Meaning & Scope Trigger | Action / Alert Level |
|---|---|:---:|
| `EXPECTED` | File is explicitly listed in `allowedFiles` of an active PMA task | Verified & Logged |
| `AUTHORIZED` | File change approved via administrative review or rename | Verified & Logged |
| `UNAUTHORIZED` | File modified during an active task but outside `allowedFiles` | Review Required |
| `UNASSOCIATED` | File modified outside an active PMA task context | Recorded as Unknown Origin |
| `PROTECTED` | File is in `protectedFiles` (`address369.ts`, `cubio_studio.db`, Phase 8) | High-Priority Forensic Alert |
| `ARCHIVED` | Modification within `archive/` historical evidence tiers | Logged as Archived |
| `GENERATED` | Build artifact or log file (`dist/`, `.temp`, `.log`) | Routine Output |
| `TEST_ARTIFACT` | Test file or scratch fixture (`src/test_*`, `scratch/`) | Test Logged |
| `RESEARCH_ARTIFACT`| Prototype file or experiment log (`research/`, `experiments/`) | Research Logged |
| `CONFIGURATION` | Build or workspace config (`package.json`, `tsconfig.json`) | Config Impact Check |
| `PRODUCTION` | Unclassified change within production `src/` modules | Investigation Required |
| `UNKNOWN` | Ambiguous or unverifiable file change | Review Required |

---

## 3. Protected Systems Monitored

1. **Spatial 369 Core Authority** (`src/core/address369.ts`):
   - Monitored for size, SHA-256 (`12EEF2D3...`), git diff, and Formula A mapping integrity.
   - Any mutation triggers instant `PROTECTED_MUTATION_ALERT` and halts PMA development flow.
2. **Canonical Sparse Memory VDB** (`data/cubio_studio.db`):
   - Monitored for size (`77,824 bytes`) and SHA-256 (`E8CB4147...`).
   - Unauthorized mutations trigger instant `DATABASE_CHANGE_DETECTED` alert without automatic rollback.
3. **Phase 8 Certified Baselines** (`phase8_baseline_manifest.json`):
   - All 11 certified Phase 8 subsystem files tracked bit-for-bit.

---

## 4. Resource Discipline & Bounded Storage

- **Bounded Queue**: In-memory change queue is hard-capped at `MAX_CHANGE_QUEUE_CAPACITY = 500`.
- **Lazy Hashing**: File contents are only hashed when metadata (size/mtime) differs or when verifying critical protected files.
- **Debounced Observation**: Redundant duplicate events on the same file content are deduplicated as `METADATA_CHANGED`.
