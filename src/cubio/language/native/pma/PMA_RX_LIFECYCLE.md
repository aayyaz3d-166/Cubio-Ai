# CUBiO AI — PMA ↔ RX Evidence Lifecycle Integration

## Task 30 — PMA ↔ RX F10 Lifecycle & Evidence Integration

**Location:** `src/cubio/language/native/pma/`  
**Status:** CERTIFIED — 31/31 gates PASSED  

---

## 1. Architectural Overview

Task 30 integrates the **existing RX F10 Lifecycle Engine** (`RxLifecycleIntegrationEngine`, `RxStage` 0..5, monotonic progression, State-T authority, and OCC validation) directly with the **Native Project Manager Agent (PMA)**.

RX serves as the **ephemeral execution lifecycle + cryptographic evidence/provenance reference collector** for every PMA-managed TASK, EXPERIMENT, TEST, or RESEARCH execution.

```
                 USER
                   ↓
                tinyPMA (Interpreter / Classifier)
                   ↓
              Native PMA (Orchestrator / Planning Gate)
                   ↓
              PMA TASK ID
                   ↓
              RX LIFECYCLE (Session: RX-LIFE-<taskId>)
                   ↓
       RX0 → RX1 → RX2 → RX3
                         ↓
                        RX4 (Evolution, Verification, Test Outcomes)
                         ↓
                    State-T + OCC (Canonical Promotion Gate)
                         ↓
                  Canonical VDB (Unmutated unless approved)
                         ↓
                        RX5 (Exit, Bounded Cache Release)
                         ↓
                 PMA Project Memory (Persistent Provenance & Ledger)
```

---

## 2. Core Separation of Responsibilities

| Subsystem | Responsibilities | Does NOT Do |
|---|---|---|
| **tinyPMA** | Natural-language interpretation, task classification, term extraction, existing work discovery, structured PMA handoff. | Does not plan development or manage lifecycles. |
| **Native PMA** | Task definition, planning gate, boundary enforcement, developer handoff contracts, post-development 9-point verification, project memory. | Does not execute low-level state transitions or duplicate RX. |
| **RX F10 Lifecycle** | Ephemeral execution sessions (RX0..RX5), monotonic transitions, OCC concurrency, State-T authority, bounded runtime cache, reference-based evidence collection. | Does not act as project manager or directly mutate canonical VDB. |
| **Project Memory** | Persistent task records, cryptographic provenance hashes, audit ledger. | Does not duplicate RX evidence events or cache runtime objects. |
| **Rxiver** | RX governance, validation, and runtime invariant assertions. | Does not manage project tasks. |

---

## 3. Evidence Lifecycle Model Across Stages

Evidence is collected using **STORE ONCE, REFERENCE EVERYWHERE**:
- Evidence structures store cryptographic hashes, IDs, and path references.
- File contents, database tables, and reports are **never duplicated** into evidence events.

| Stage | Name | Recorded Evidence |
|---|---|---|
| **RX0** | Birth | Initial task creation, PMA task reference, objective hash, tenant ID, initial provenance. |
| **RX1** | Superposition | Candidate capabilities discovered from `CapabilityResolver`, relevant execution context. |
| **RX2** | Interaction | Selected reuse strategy (`REUSE`, `COMPOSE`, `EXTEND`, `NEW`), allowed file boundaries, dependencies. |
| **RX3** | Awareness Growth | Cross-subsystem impact, constraint notes, and filesystem changes classified by `ProjectChangeWatcher`. |
| **RX4** | Evolution | Implementation diff references, unit test results, build verdict, 9-point post-development review findings. Optional State-T canonical promotion. |
| **RX5** | Exit | Final lifecycle verdict (`PASS`, `PARTIAL_PASS`, `BLOCKED`), master provenance SHA-256 hash, cleanup and release of active ephemeral working cache. |

---

## 4. Key Interfaces & Contracts

### `PMARxEvidenceEvent`
```typescript
export interface PMARxEvidenceEvent {
  readonly eventId: string;
  readonly taskId: string;
  readonly rxLifecycleId: string;
  readonly stage: RxStage;
  readonly eventType: PMARxEventType;
  readonly sequence: number;
  readonly timestamp: number;
  readonly sourceReference: string;
  readonly artifactReference: string;
  readonly contentHash: string;
  readonly tenantId: string;
  readonly cellId?: number;
  readonly resultStatus: 'PASS' | 'PARTIAL_PASS' | 'FAIL' | 'BLOCKED' | 'INFO';
  readonly verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'REJECTED';
  readonly provenanceHash: string;
}
```

### `PMARxEvidenceSummary`
```typescript
export interface PMARxEvidenceSummary {
  readonly taskId: string;
  readonly rxLifecycleId: string;
  readonly tenantId: string;
  readonly finalStage: RxStage;
  readonly totalEvidenceCount: number;
  readonly evidenceEventIds: readonly string[];
  readonly involvedFiles: readonly string[];
  readonly involvedCapabilities: readonly string[];
  readonly testResults: Readonly<Record<string, 'PASS' | 'FAIL'>>;
  readonly finalVerdict: 'PASS' | 'PARTIAL_PASS' | 'BLOCKED';
  readonly masterProvenanceHash: string;
  readonly timestamp: number;
}
```

---

## 5. Files Added & Modified

| File | Type | Description |
|---|---|---|
| `src/cubio/language/native/pma/pmaRxEvidenceLifecycle.ts` | **NEW** | PMA ↔ RX integration engine, stage progression, evidence reference collection, master provenance aggregation. |
| `src/cubio/language/native/pma/PMA_RX_LIFECYCLE.md` | **NEW** | Architectural specification and integration documentation. |
| `src/test_pma_rx_integration.ts` | **NEW** | 31-gate comprehensive test suite covering identity, progression, evidence, isolation, determinism, and regression. |
| `PMA_TASK30_FINAL_REPORT.md` | **NEW** | Final report with verification outcomes and evidence. |
| `src/cubio/language/native/pma/types.ts` | MODIFIED | Extended `PMATaskMemoryRecord` and `GoldenPathExecutionResult` with optional RX fields. |
| `src/cubio/language/native/pma/projectMemory.ts` | MODIFIED | Updated `recordCompletedTask()` to absorb `PMARxEvidenceSummary` and incorporate RX provenance into hashes. |
| `src/cubio/language/native/pma/projectManagerAgent.ts` | MODIFIED | Wired `PMARxEvidenceEngine`, exposed `getRxEvidenceEngine()`, updated `executeGoldenPath()` to coordinate RX0..RX5. |
| `src/cubio/language/native/pma/index.ts` | MODIFIED | Exported `pmaRxEvidenceLifecycle.ts`. |
