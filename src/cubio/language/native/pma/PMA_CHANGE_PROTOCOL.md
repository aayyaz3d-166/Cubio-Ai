# CUBiO AI — 3D Memory Studio
# Task 28: Persistent Project Change Watcher Protocol

**Document ID:** `CUBIO-PMA-CHANGE-PROTOCOL-V1`  
**Location:** `src/cubio/language/native/pma/`  
**Enforcement:** MANDATORY READ-ONLY FILESYSTEM OBSERVATION  

---

## 1. Task Lifecycle Change Protocol

```
[1] User Invocation (@PMA <Prompt>)
       │
       ▼
[2] Capture Task Baseline Snapshot
       │  ├── Record start timestamp
       │  ├── Enumerate allowedFiles
       │  └── Enumerate protectedFiles
       │
       ▼
[3] Development & Test Execution
       │
       ▼
[4] Incremental Change Observation
       │  ├── Inspect targeted files
       │  ├── Compare against snapshot (Size, SHA-256)
       │  └── Classify change:
       │        ├── In allowedFiles   --> EXPECTED
       │        ├── In protectedFiles --> PROTECTED (ALERT!)
       │        └── Unapproved        --> UNAUTHORIZED
       │
       ▼
[5] Dependency & Invariant Impact Analysis
       │  ├── Check spatial 369 impact
       │  ├── Check canonical database impact
       │  └── Check configuration/test impact
       │
       ▼
[6] Post-Dev Verification Audit
       │
       ▼
[7] Record Change Event in ProjectMemory
       │
       ▼
[8] Task Completion (endTaskContext)
```

---

## 2. Changes Outside Active PMA Tasks (Unassociated Changes)

When filesystem modifications occur without an active `@PMA` task:
1. **Never Assume Malicious Intent**: Users or external processes frequently run experiments, update documentation, or edit scripts.
2. **Mark as UNASSOCIATED**: The change is labeled `UNASSOCIATED` with scope status `UNASSOCIATED`.
3. **Analyze Provenance**: Inspect git status, file location, and modification timestamp.
4. **Log in ProjectMemory**: Append to the sovereign change ledger for persistent auditability.
5. **No Destructive Action**: Do not delete, revert, or overwrite unassociated changes.

---

## 3. Failure Handling & Reconciliation Protocol

1. **`WATCHER_STATE_UNCERTAIN`**: Triggered if filesystem events may have been dropped or out of sync.
2. **`BASELINE_RECONCILIATION_REQUIRED`**: Triggered if disk hashes conflict with in-memory metadata.
3. **Reconciliation Action**:
   - Call `reconcileBaseline(paths?: string[])`.
   - Re-reads targeted file stats and re-computes hashes.
   - Resets state to `WATCHER_ACTIVE`.
