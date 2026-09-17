# CUBiO AI Web MVP — Standalone Deployment Distribution

> **Certified Production Baseline**: Phase 21 / PMA Tasks 311 & 312  
> **Status**: Ready for Manual Private-GitHub Push and Railway Cloud Deployment  
> **Architecture**: Native 1M Inference Engine + SQLite VDB + Sovereign Address369 + React/Vite Web Studio

---

## 1. Overview

This repository contains the clean, self-contained standalone deployment distribution of the **CUBiO AI Web MVP**. It was extracted and verified directly from the authoritative production baseline under strict Project Management Authority (PMA) protocols.

### Key Architectural Characteristics
- **Zero External AI Leakage**: 100% self-hosted Native 1M model inference running on-instance. No OpenAI, Anthropic, or external cloud API calls.
- **Fail-Closed Actuation Lockout**: Permanent actuation blocking (`IS_ACTUATION_BLOCKED = true`) strictly prevents arbitrary code execution or system tampering.
- **Sovereign Canonical Assets**:
  - Production Vector Database: `data/cubio_studio.db` (SHA-256: `bafd4afd53bf93b2924f869e2c061853162a0d6eedd853a7ba704172e9fd9ff6`)
  - Sealed Phase16 1M Checkpoint: `data/checkpoints/phase16_production_final_sealed_1m.3dmemory` (SHA-256: `453590e284f250525d42d5f99d8fca07957f1e0ac1218b7d43eff6d3a762c1b8`)
  - Sovereign Address369 Validator: `src/core/address369.ts` (SHA-256: `12eef2d3ec79bce873a064443787587a32711145ea82d375333c2222303fe612`)
- **Self-Contained Dependency Closure**: Contains only the 1,791 source files required for production runtime, eliminating all experimental scratch code, historical test suites, and internal staging assets.

---

## 2. Repository Structure

```
CUBiO-AI-MVP/
├── .env.example                       # Production environment template
├── .gitignore                         # Strict production gitignore (preserves canonical data)
├── MANIFEST_DEPENDENCIES.json         # Dependency tree mapping for all imported modules
├── MANIFEST_INCLUDED.json             # Manifest of all 1,791 included production files
├── Procfile                           # Railway web dyno declaration (web: npm start)
├── railway.json                       # Railway Nixpacks deployment configuration
├── package.json                       # Production scripts and dependencies
├── package-lock.json                  # Locked dependency graph
├── tsconfig.json                      # TypeScript build configuration
├── vite.config.ts                     # Frontend build configuration
├── index.html                         # SPA entrypoint
├── server.ts                          # Production Express backend & API v1 router
├── data/
│   ├── cubio_studio.db                # Canonical SQLite production VDB (tracked)
│   └── checkpoints/
│       └── phase16_production_final_sealed_1m.3dmemory # Sealed 1M model weights (tracked)
└── src/
    ├── core/                          # Native 1M model, Address369, VDB interfaces
    ├── cubio/web/                     # Web studio SPA UI and components
    ├── api/                           # Production API controllers and schemas
    └── ...                            # Exact production dependency closure
```

---

## 3. Local Development & Verification

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Build the production web UI bundle
npm run build

# 3. Start the production backend server
npm start
```
By default, the server listens on `http://localhost:3000` (or the `PORT` environment variable).

### Health & Verification Endpoints
- `GET /health` — Verifies server uptime, Native 1M model status, and VDB connection.
- `POST /api/v1/chat` — Native CUBiO 1M conversational inference endpoint.
- `POST /api/v1/query` — Vector database semantic search and retrieval endpoint.
- `GET /api/v1/models` — Active model information (reporting `cubio-native-1m-production`).

---

## 4. Manual Deployment Runbook

Follow these steps to deploy this standalone repository to your private GitHub account and Railway:

### Step 1: Manual Private GitHub Push (User-Owned)

> **Important**: Always ensure the GitHub repository visibility is set to **PRIVATE**. Never publish production models or proprietary VDB assets to a public repository.

1. In your terminal, inside this folder (`Desktop\CUBiO-AI-MVP`):
   ```bash
   git status
   ```
   Confirm that all files are committed and the working tree is clean.

2. Create a new **PRIVATE** repository on your GitHub account (e.g. `cubio-ai-mvp`).

3. Link the remote and push:
   ```bash
   git remote add origin git@github.com:<YOUR_GITHUB_USERNAME>/cubio-ai-mvp.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 2: Manual Railway Deployment (User-Owned)

1. Log into your Railway Dashboard (https://railway.app).
2. Click **+ New Project** and select **Deploy from GitHub repo**.
3. Select your private repository: `<YOUR_GITHUB_USERNAME>/cubio-ai-mvp`.
4. Railway will automatically detect:
   - `railway.json` build and start commands (`npm run build` and `npm start`).
   - `Procfile` web process specification.
5. In the Railway service settings:
   - **Environment Variables**: Add any custom overrides if needed (Railway assigns `PORT` automatically).
   - Under **Networking**, generate a public domain (e.g., `cubio-ai-mvp.up.railway.app`).
6. Trigger the deployment:
   - Railway builds the Vite frontend via `npm run build`.
   - Railway launches the Node.js server via `tsx server.ts`.
7. Once active, verify your live deployment by checking:
   ```
   https://<your-railway-domain>.up.railway.app/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "cubio-ai-web-mvp",
     "model": "cubio-native-1m-production",
     "modelLoaded": true,
     "vdb": "connected",
     "actuationBlocked": true
   }
   ```

---

## 5. Security & Isolation Matrix

| Control | Implementation | Verification |
|---|---|---|
| **External AI Calls** | Zero network calls outside host | Audited in Task 308 & 311 |
| **Actuation Guard** | `IS_ACTUATION_BLOCKED = true` | Permanent fail-closed invariant |
| **Data Sovereignity** | Address369 cryptographic validation | Pristine SHA-256 match |
| **Model Weights** | Sealed Phase16 1M Checkpoint | Hash verified on boot |
| **Vector DB** | Embedded SQLite (`data/cubio_studio.db`) | Read-only runtime isolation |\n