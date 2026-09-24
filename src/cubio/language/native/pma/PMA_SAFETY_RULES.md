# CUBiO AI — 3D Memory Studio
# Task 27: Native Project Manager Agent (PMA) Safety Rules

**Document ID:** `CUBIO-PMA-SAFETY-V1`  
**Location:** `src/cubio/language/native/pma/`  
**Status:** PERMANENT SYSTEM INVARIANTS  

---

## 1. Sovereignty & Offline Execution Rules

1. **Zero External AI Models:**  
   No OpenAI, Anthropic, Google Gemini, Meta Llama, Alibaba Qwen, HuggingFace inference, or external cloud LLM APIs may be called at runtime.
2. **Zero External Vector Databases:**  
   Pinecone, Milvus, Qdrant, Chroma, and Weaviate are prohibited. The canonical local SQLite VDB (`data/cubio_studio.db`) is the exclusive vector memory authority.
3. **Zero Unauthorized Telemetry:**  
   No outbound network communication, analytics tracking, or remote logging.
4. **Static Blacklist Discrimination:**  
   Strings like `OpenAI`, `GPT`, `Gemini`, `Claude`, `Qwen` appearing within test fixtures, assertion checks, or security scanners are recognized as harmless static tokens and are not flagged as runtime dependencies.

---

## 2. Hardware Actuation Safety Rules

1. **Permanent Actuation Lockout:**  
   PMA strictly inherits `is_actuation_blocked = true`.
2. **Fail-Closed Command Interception:**  
   Any user request or proposed development attempting physical hardware actuation (e.g., "actuate hardware", "move robotic arm", "drive motor", "switch circuit", "fire thruster") is intercepted fail-closed with `EXTERNAL_AI_DETECTED` / `HARDWARE_ACTUATION_PROHIBITED`.
3. **Software Domain Quarantining:**  
   PMA governs software engineering, testing, data modeling, and spatial simulation within the 3D Memory Studio application. It cannot actuate physical machinery.

---

## 3. Database & Spatial Baseline Rules

1. **Canonical VDB Bitwise Immutability:**  
   `data/cubio_studio.db` has size `77,824 bytes` and SHA-256 `E8CB4147DD1DCF73B29FB0EF270B75EFD3B93598F3130D0625F9ED4A0DF2C493`. Any silent mutation triggers an automatic review verdict of `BLOCKED`.
2. **Address 369 Spatial Core Immutability:**  
   `src/core/address369.ts` has SHA-256 `12EEF2D3EC79BCE873A064443787587A32711145EA82D375333C2222303FE612`. Formula A ($cellId = x + 7y + 49z, address369 = 26 + cellId$) must remain bitwise identical ($\Delta = 0$).
