# CUBiO AI — Task 31 Documentation
# PMA Global Task Entry Gate & Mandatory Task Routing Layer

**Status:** CERTIFIED — 25/25 Gates PASSED  
**Namespace:** `src/cubio/language/native/pma/`  

---

## 1. Overview & Mandatory Flow

The **Global Task Entry Gate** (`GlobalTaskEntryGate`) is the sovereign, top-level intake and enforcement layer sitting directly ABOVE `tinyPMA` and `Native PMA`.

It enforces the mandatory rule:
**NO TASK MAY DIRECTLY REACH DEVELOPER, AGENT, FILE MODIFICATION, BUILD, TEST, TRAINING, OR EXPERIMENT OPERATIONS WITHOUT PASSING THROUGH THE GLOBAL PMA ENTRY GATE.**

```
                 ANY TASK
                    │
                    ▼
        ╔══════════════════════╗
        ║ GLOBAL PMA ENTRY GATE║
        ║  MANDATORY ROUTER    ║
        ╚══════════╤═══════════╝
                   │
                   ▼
                tinyPMA
                   │
                   ▼
              Native PMA
                   │
                   ▼
           Project Discovery
                   │
                   ▼
         Capability Resolution
                   │
                   ▼
          Safety / Scope Gate
                   │
                   ▼
          Authorized Handoff
                   │
                   ▼
           Developer / Agent
                   │
                   ▼
                 FILES
                   │
                   ▼
            Change Watcher
                   │
                   ▼
              TEST / VERIFY
                   │
                   ▼
              RX EVIDENCE
                   │
                   ▼
            PMA FINAL REVIEW
                   │
                   ▼
             PROJECT MEMORY
                   │
                   ▼
                 CLOSED
```

---

## 2. Core Responsibilities

1. **Intake & Identity:** Assigns unique `TaskIntakeID` and deterministic `TaskID` with SHA-256 provenance.
2. **Deterministic State Machine:** Advances sequentially through validated states without jumping.
3. **Bypass Protection:** Rejects any direct execution attempt lacking an authorized, matching `TaskExecutionAuthorization` token.
4. **tinyPMA Activation:** Passes incoming prompts to `tinyPMA` for classification and term extraction.
5. **Native PMA Handoff:** Forwards structured requests to `PMAPlanner` for capability reuse, boundary scoping, and conflict detection.
6. **Execution Authorization:** Issues a cryptographically signed `TaskExecutionAuthorization` containing `allowedFiles`, `protectedFiles`, invariants, and handoff hashes.
7. **Lifecycle Coordination:** Binds Change Watcher, RX Evidence Engine, Post-Dev Verifier, and Project Memory during authorized execution.

---

## 3. Supported Task Types

- `BUILD`
- `TEST`
- `EXPERIMENT`
- `DEBUG`
- `RESEARCH`
- `OPTIMIZATION`
- `REFACTOR`
- `MIGRATION`
- `ARCHITECTURE`
- `TRAINING`
- `BENCHMARK`
- `INTEGRATION`
- `VALIDATION`
- `REGRESSION`
- `AUDIT`
- `DEPLOYMENT`
- `DOCUMENTATION`
- `OTHER`
- `UNKNOWN` (enters Gate, interpreted by tinyPMA, fail-closed if ambiguous)

---

## 4. Host-Level Limitation Notice

> [!IMPORTANT]
> **Host-Level Interception Notice:**
> Software-level routing and execution authorization are strictly enforced within the One Language application and task infrastructure.
> Host-level interception of arbitrary external IDE shell commands or conversations requires a supported host hook/API provided by the IDE host environment.
