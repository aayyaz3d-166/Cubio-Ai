# CUBiO AI — Task Routing Protocol
# Task 31: Deterministic State Machine & Protocol

**Namespace:** `src/cubio/language/native/pma/`  

---

## 1. Routing State Transitions

Every task received by `GlobalTaskEntryGate` transitions through a monotonic, deterministic sequence:

```
RECEIVED
   ↓
ENTRY_VALIDATED
   ↓
TINY_PMA_PENDING
   ↓
TINY_PMA_ACTIVE
   ↓
NATIVE_PMA_PENDING
   ↓
NATIVE_PMA_ACTIVE
   ↓
DISCOVERY
   ↓
CAPABILITY_RESOLUTION
   ↓
SAFETY_CHECK
   ↓
HANDOFF_READY
   ↓
EXECUTION_AUTHORIZED
   ↓
EXECUTING
   ↓
VERIFICATION
   ↓
FINAL_REVIEW
   ↓
MEMORY_COMMIT
   ↓
CLOSED
```

---

## 2. Terminal & Failure States

If an invariant is violated or a check fails, the task transitions immediately into one of the explicit fail-closed states:

- `REJECTED`: Request prompt is empty, contains external AI keywords, or is rejected by tinyPMA.
- `BLOCKED`: Planning conflicts detected (e.g. duplicate engine creation, canonical DB write, frozen file touch).
- `FAILED`: Unit tests, build, or regression check failed during verification.
- `UNKNOWN`: Request cannot be classified and has no project vocabulary context (fail-closed).
- `UNAUTHORIZED`: Scope boundary violation or missing authorization token.
- `BYPASS_ATTEMPT`: Direct developer execution or file modification attempted without passing through the Entry Gate.

---

## 3. Recursion & Concurrency Rules

1. **Recursion Guard:** If an active intake stack contains the same `taskId`, or if execution depth exceeds `MAX_EXECUTION_DEPTH = 3`, the request is immediately rejected with `RECURSION_DETECTED`.
2. **Concurrency Isolation:** Each task maintains an isolated `TaskIntakeRecord`, `TaskExecutionAuthorization`, and unique authorization token. One task cannot inherit or execute using another task's authorization.
