# CUBiO AI — tinyPMA Architecture

## Task 29 — tinyPMA: Task & Experiment Interpreter

**Location:** `src/cubio/language/native/pma/`  
**Status:** CERTIFIED — 28/28 tests PASSED

---

## Overview

tinyPMA is a lightweight front-layer interpreter/classifier/router that sits **inside** the existing Native PMA architecture. It converts a user's natural-language request into a structured `TinyPMAHandoff` that flows into `CubiOProjectManagerAgent.planTask()`.

```
USER NATURAL-LANGUAGE REQUEST
        ↓
     tinyPMA
        ↓
Interpret / Classify / Extract
        ↓
Existing Work Discovery
        ↓
Reuse / Compose / Extend / New Recommendation
        ↓
Structured PMA Handoff (TinyPMAHandoff)
        ↓
   Native PMA
        ↓
Study → Plan → Developer → Test → Verify → Project Memory
```

---

## Files Added (Task 29)

| File | Role |
|------|------|
| `tinyPMATypes.ts` | All tinyPMA type definitions (extends existing `types.ts`, no duplicates) |
| `tinyPMA.ts` | Core `TinyPMA` class — deterministic NL interpreter/classifier |
| `PMA_TINY_PMA.md` | This document |

## Files Modified (Task 29)

| File | Change |
|------|--------|
| `projectManagerAgent.ts` | Added `TinyPMA` field, `interpretRequest()`, `getTinyPMA()` methods, `TinyPMAInterpretationResult` interface |
| `index.ts` | Added `export * from './tinyPMA'` and `export * from './tinyPMATypes'` |

---

## Classification Taxonomy

tinyPMA classifies every request into one of these types (deterministic — same prompt always returns same type):

| Type | Keywords Trigger |
|------|-----------------|
| `TASK` | implement, create, build feature, add capability |
| `EXPERIMENT` | experiment, prototype, proof of concept, spike, exploratory |
| `TEST` | unit test, test suite, test case, write test, gate test |
| `RESEARCH` | research, study, analyze, forensic, discovery, master index |
| `BUILD` | build, npm run build, vite build, compile, bundle |
| `AUDIT` | audit, sha256, hash check, frozen file, db integrity |
| `BENCHMARK` | benchmark, throughput, measure performance, profiling |
| `TRAINING` | train, finetune, dataset, epoch, ground truth |
| `DEBUG` | debug, fix bug, error, exception, crash, stack trace |
| `OPTIMIZATION` | optimize, speed up, reduce memory, cache, LRU |
| `INTEGRATION` | integrate, wire together, end-to-end, bridge |
| `REFACTOR` | refactor, clean up, restructure, extract function |
| `MIGRATION` | migrate, upgrade, port, convert, version bump |
| `ARCHITECTURE` | architecture, system design, component design, ADR |
| `VALIDATION` | validate, verify correctness, sanity check |
| `REGRESSION` | regression, regression lock, gate regression |
| `UNKNOWN` | (no recognized project keywords) — **fail-closed** |

---

## Determinism Guarantee

Classification uses **exact keyword-score matching**:

1. Each classification entry gets a score = sum of matched keyword lengths
2. Winner = highest score (ties broken alphabetically on type name)
3. No randomness, no AI model calls
4. Same prompt → same `TinyPMARequestType` **always** (verified by Gate 26: A=B=C)

---

## Sovereignty Rules

| Rule | Status |
|------|--------|
| `is_actuation_blocked = true` | ✓ Permanent |
| No external AI/cloud runtime | ✓ Zero cloud dependencies |
| UNKNOWN is explicit | ✓ Never silently re-mapped |
| External AI CRITICAL risk | ✓ Detected and rejected |
| Frozen files detected | ✓ `frozenDependencies` populated |
| address369 Delta=0 | ✓ `touches369` + HIGH risk flagged |
| Database Delta=0 | ✓ `touchesDatabase` + HIGH risk flagged |

---

## Key Interfaces

```typescript
// Output of TinyPMA.interpretRequest()
interface TinyPMAHandoff {
  interpretationId: string;       // SHA-256 based, deterministic
  requestText: string;
  requestType: TinyPMARequestType; // The classification winner
  taskTitle: string;
  extractedTerms: TinyPMAExtractedTerms;
  domains: readonly string[];      // Subsystem IDs for PMA scope
  relatedTasks: readonly TinyPMARelatedTask[];
  relatedExperiments: readonly TinyPMARelatedExperiment[];
  relatedReports: readonly TinyPMARelatedReport[];
  relatedEngines: readonly TinyPMARelatedEngine[];
  relatedCapabilities: readonly string[];
  frozenDependencies: readonly string[];
  riskLevel: TinyPMARiskLevel;
  riskFactors: TinyPMARiskFactors;
  recommendedAction: PMAReuseStrategy;  // REUSE / COMPOSE / EXTEND / NEW
  recommendationReason: string;
  pmaStudyScope: readonly string[];
  duplicateWarnings: readonly string[];
  isApprovedForPMAHandoff: boolean;
  rejectionReason?: string;
  mappedPMATaskType: PMATaskType;
  timestamp: number;
}
```

---

## Integration Points

### Direct tinyPMA usage
```typescript
const tiny = new TinyPMA();
const handoff = tiny.interpretRequest('Implement multimodal fusion integration');
// handoff.requestType === 'TASK'
// handoff.recommendedAction === 'REUSE' (existing fusion engine found)
```

### Via CubiOProjectManagerAgent (orchestrator)
```typescript
const pma = new CubiOProjectManagerAgent();

// Interpretation only (no planning)
const result = pma.interpretRequest('Research the forensic capability map');
console.log(result.tinyHandoff.requestType); // 'RESEARCH'

// Interpretation + auto-plan in one call
const full = pma.interpretRequest('Implement new language feature', true);
console.log(full.tinyHandoff);  // TinyPMAHandoff
console.log(full.pmaHandoff);   // PMAHandoffContract (if approved)
```

---

## Reuse Discipline

tinyPMA **reuses** (does not duplicate):
- `CapabilityResolver.resolveCapabilitiesForTask()` — 13-entry registry for engine matching
- `ProjectNavigator` — 15-subsystem catalog for domain resolution
- `CubiOProjectManagerAgent.planTask()` — downstream PMA planning gate

No new registries. No second PMA. No parallel architecture.
