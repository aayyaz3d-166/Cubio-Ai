# CUBiO AI — Execution Authorization Model
# Task 31: Authorization & Bypass Protection

**Namespace:** `src/cubio/language/native/pma/`  

---

## 1. Explicit Authorization Contract

Execution authorization is never implicit. A valid authorization token is issued ONLY after:
1. `tinyPMA` approves classification and term extraction.
2. `Native PMA` performs capability discovery, conflict check, and frozen baseline validation.
3. Developer handoff contract is signed and SHA-256 hashed.

```typescript
export interface TaskExecutionAuthorization {
  readonly isAuthorized: boolean;
  readonly authorizationToken: string;
  readonly taskIntakeId: string;
  readonly taskId: string;
  readonly requestType: TinyPMARequestType;
  readonly allowedFiles: readonly string[];
  readonly protectedFiles: readonly string[];
  readonly scope: readonly string[];
  readonly capabilities: readonly string[];
  readonly dependencies: readonly string[];
  readonly safetyConstraints: readonly string[];
  readonly acceptanceCriteria: readonly string[];
  readonly handoffHash: string;
  readonly provenanceHash: string;
  readonly authorizedAt: number;
  readonly rejectionReason?: string;
}
```

---

## 2. File Boundary Enforcement

During execution:
- Developer operations are restricted strictly to `allowedFiles`.
- Any modification to `protectedFiles` (e.g. `src/core/address369.ts`, `data/cubio_studio.db`, Phase 8 baselines) is intercepted and rejected.
- Modifications outside `allowedFiles` generate an immutable `TaskBypassRecord` and set final review verdict to `BLOCKED`.

---

## 3. Direct Execution Bypass Interception

The method `validateDirectExecution()` audits all attempted execution calls:
- Missing authorization token → REJECTED with `NO_AUTHORIZATION_TOKEN`.
- Expired or mismatched authorization token → REJECTED with `INVALID_AUTHORIZATION_TOKEN`.
- Target files outside allowed boundary → REJECTED with `UNAUTHORIZED_FILE_ACCESS`.
