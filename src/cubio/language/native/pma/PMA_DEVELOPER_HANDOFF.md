# CUBiO AI — 3D Memory Studio
# Task 27: Native Project Manager Agent (PMA) Developer Handoff Contract Specification

**Document ID:** `CUBIO-PMA-HANDOFF-SPEC-V1`  
**Location:** `src/cubio/language/native/pma/`  
**Contract Invariant:** Developer MUST stay strictly inside defined boundaries.  

---

## 1. Structure of the PMA Developer Handoff Contract

Every approved task produces a cryptographically hashed `PMAHandoffContract` containing:

```typescript
export interface PMAHandoffContract {
  readonly taskId: string;
  readonly objective: string;
  readonly scope: PMASubsystemScope;
  readonly relevantFiles: readonly string[];
  readonly existingCapabilities: readonly PMACandidateCapability[];
  readonly reuseStrategy: PMAReuseStrategy;
  readonly allowedFiles: readonly string[];
  readonly protectedFiles: readonly string[];
  readonly dependencies: readonly string[];
  readonly databaseImpact: PMADatabaseImpact;
  readonly spatial369Impact: PMASpatial369Impact;
  readonly securityImpact: PMASecurityImpact;
  readonly requiredTests: readonly string[];
  readonly regressionRequirements: readonly string[];
  readonly expectedInvariants: readonly string[];
  readonly rollbackConsiderations: string;
  readonly conflicts: readonly PMAConflictRecord[];
  readonly handoffHash: string;
  readonly isApprovedForDevelopment: boolean;
  readonly rejectionReason?: string;
  readonly timestamp: number;
}
```

---

## 2. Developer Boundary Rules

1. **ALLOWED FILES**:  
   The developer is strictly authorized to create, edit, or remove files that are explicitly enumerated in `allowedFiles`. Any change outside this set triggers an immediate `BOUNDARY_VIOLATION` during post-development inspection.

2. **PROTECTED FILES**:  
   Files in `protectedFiles` (including `src/core/address369.ts`, `data/cubio_studio.db`, `phase8_baseline_manifest.json`, and all certified Phase 8 subsystem files) are strictly immutable. Modifying them triggers immediate task blocking and regression failure.

3. **REUSE DISCIPLINE**:  
   If `reuseStrategy` is `REUSE`, the developer must import and consume the referenced component without reimplementing its logic. If `COMPOSE`, existing subsystems must be connected via modular composition. Only when `NEW` is approved may a novel component be implemented.

4. **DATABASE IMPACT**:  
   If `databaseImpact` is `DATABASE_READ_ONLY`, zero write transactions, migrations, or file alterations to `data/cubio_studio.db` are permitted.

5. **SPATIAL 369 IMPACT**:  
   `src/core/address369.ts` is the sole canonical spatial authority. No parallel coordinate systems, voxel transforms, or alternative formula implementations may be created.
