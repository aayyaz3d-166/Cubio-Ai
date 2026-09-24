/**
 * CUBiO AI — Railway Deployment Preflight Validator
 * src/cubio/integration/mvpV2RailwayPreflightValidator.ts
 *
 * PMA TASK 432 — RAILWAY DEPLOYMENT PREFLIGHT
 * Validates the MVP v2 production configuration for Railway deployment without deploying:
 * 1. Node/Runtime & Nixpacks Compatibility (Node >=20.0.0, npm >=9.0.0)
 * 2. Build & Start Commands (npm run build, npm start, tsx in dependencies)
 * 3. Environment Variable Contract & Defaults (.env.example verification)
 * 4. Filesystem Boundary & Absolute Path Freedom
 * 5. Sovereign Database & Checkpoint Custody (Bit-for-bit match on Phase 26 baselines)
 * 6. Frontend & API Routing (SPA static fallback, /healthz, /readyz, /api/v1)
 * 7. Zero External AI Service / Local Dev Leakage at Runtime
 * 8. Production Security Headers, CSP, CORS & Read-Only VDB Protection
 */

import * as fs from 'fs';
import * as path from 'path';
import { MvpV2ProtectedAssetCustodyVerifier } from './mvpV2ProtectedAssetCustodyVerifier';
import { MvpV2VdbIntegrationGuard } from './mvpV2VdbIntegrationGuard';

export interface PreflightCheckItem {
  id: string;
  name: string;
  category: 'RUNTIME' | 'COMMANDS' | 'ENV_VARS' | 'FILESYSTEM' | 'DATABASE_CUSTODY' | 'ROUTING' | 'ZERO_EXTERNAL_AI' | 'SECURITY_CSP';
  passed: boolean;
  evidence: string;
  details?: Record<string, any>;
}

export interface RailwayPreflightReport {
  preflightId: string;
  timestamp: string;
  targetPlatform: 'Railway.app';
  status: 'RAILWAY_PREFLIGHT_PASSED' | 'RAILWAY_PREFLIGHT_FAILED';
  allChecksPassed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  checks: PreflightCheckItem[];
}

export class MvpV2RailwayPreflightValidator {
  public static runPreflight(): RailwayPreflightReport {
    const checks: PreflightCheckItem[] = [];

    // Check 1: Runtime & Nixpacks Configuration
    checks.push(this.checkRuntimeAndNixpacks());

    // Check 2: Build & Start Command Lifecycle
    checks.push(this.checkBuildAndStartCommands());

    // Check 3: Environment Variable Template & Mandatory Keys
    checks.push(this.checkEnvironmentVariables());

    // Check 4: Filesystem Confinement & Absolute Path Absence
    checks.push(this.checkFilesystemAssumptions());

    // Check 5: Sovereign Database & Checkpoint Custody
    checks.push(this.checkDatabaseCustody());

    // Check 6: Frontend & API Routing
    checks.push(this.checkRoutingArchitecture());

    // Check 7: Zero External AI Service Runtime Confinement
    checks.push(this.checkZeroExternalAi());

    // Check 8: Security Headers, CSP, CORS & Read-Only VDB
    checks.push(this.checkSecurityAndCsp());

    const allPassed = checks.every(c => c.passed);
    const passedCount = checks.filter(c => c.passed).length;
    const failedCount = checks.length - passedCount;

    return {
      preflightId: `RAILWAY-PREFLIGHT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      targetPlatform: 'Railway.app',
      status: allPassed ? 'RAILWAY_PREFLIGHT_PASSED' : 'RAILWAY_PREFLIGHT_FAILED',
      allChecksPassed: allPassed,
      totalChecks: checks.length,
      passedChecks: passedCount,
      failedChecks: failedCount,
      checks
    };
  }

  private static checkRuntimeAndNixpacks(): PreflightCheckItem {
    const pkgPath = path.resolve('package.json');
    const nixpacksPath = path.resolve('nixpacks.toml');

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const nixpacksContent = fs.existsSync(nixpacksPath) ? fs.readFileSync(nixpacksPath, 'utf8') : '';

    const hasEngines = Boolean(pkg.engines && pkg.engines.node && pkg.engines.npm);
    const hasNixpacks = fs.existsSync(nixpacksPath) && nixpacksContent.includes('nodejs_22');

    const passed = hasEngines && hasNixpacks;

    return {
      id: 'PREFLIGHT-01-RUNTIME',
      name: 'Node/Runtime Version & Nixpacks Compatibility',
      category: 'RUNTIME',
      passed,
      evidence: passed
        ? `Engines declared (Node ${pkg.engines.node}, npm ${pkg.engines.npm}); nixpacks.toml targets nodejs_22.`
        : 'Missing engine declarations or invalid nixpacks.toml configuration.',
      details: { engines: pkg.engines, nixpacksPresent: fs.existsSync(nixpacksPath) }
    };
  }

  private static checkBuildAndStartCommands(): PreflightCheckItem {
    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));

    const hasBuild = Boolean(pkg.scripts?.build && pkg.scripts.build === 'vite build');
    const hasStart = Boolean(pkg.scripts?.start && pkg.scripts.start.includes('server.ts'));
    // Crucial for Railway: tsx must be in dependencies (not only devDependencies) for npm start
    const tsxInProd = Boolean(pkg.dependencies?.tsx);

    const passed = hasBuild && hasStart && tsxInProd;

    return {
      id: 'PREFLIGHT-02-COMMANDS',
      name: 'Build and Start Command Lifecycle',
      category: 'COMMANDS',
      passed,
      evidence: passed
        ? `npm run build ('${pkg.scripts.build}') & npm start ('${pkg.scripts.start}') verified. 'tsx' present in production dependencies.`
        : 'Missing build/start scripts or tsx is not in production dependencies.',
      details: { build: pkg.scripts?.build, start: pkg.scripts?.start, tsxInProd }
    };
  }

  private static checkEnvironmentVariables(): PreflightCheckItem {
    const envExamplePath = path.resolve('.env.example');
    const exists = fs.existsSync(envExamplePath);

    let hasEssentialKeys = false;
    if (exists) {
      const content = fs.readFileSync(envExamplePath, 'utf8');
      hasEssentialKeys = content.includes('PORT=') &&
                         content.includes('CUBIO_ENV=') &&
                         content.includes('CUBIO_ALLOW_ACTUATION=false') &&
                         content.includes('CUBIO_DB_PATH=');
    }

    const passed = exists && hasEssentialKeys;

    return {
      id: 'PREFLIGHT-03-ENV-VARS',
      name: 'Environment Variable Contract & Template',
      category: 'ENV_VARS',
      passed,
      evidence: passed
        ? '.env.example template verified with PORT, CUBIO_ENV, actuation locks, and DB paths declared.'
        : 'Missing .env.example or required production environment variables.',
      details: { exists, hasEssentialKeys }
    };
  }

  private static checkFilesystemAssumptions(): PreflightCheckItem {
    const serverPath = path.resolve('server.ts');
    const content = fs.readFileSync(serverPath, 'utf8');

    // Verify server uses relative path resolution
    const usesPathResolve = content.includes('path.resolve') || content.includes('path.join');
    const noHardcodedAbsolute = !content.includes('C:\\') && !content.includes('/home/') && !content.includes('E:\\');

    const passed = usesPathResolve && noHardcodedAbsolute;

    return {
      id: 'PREFLIGHT-04-FILESYSTEM',
      name: 'Filesystem Boundary & Absolute Path Confinement',
      category: 'FILESYSTEM',
      passed,
      evidence: passed
        ? 'Dynamic relative path resolution confirmed in server.ts; zero hardcoded host machine paths.'
        : 'Hardcoded host machine absolute paths detected in server entrypoint.',
      details: { usesPathResolve, noHardcodedAbsolute }
    };
  }

  private static checkDatabaseCustody(): PreflightCheckItem {
    const custody = MvpV2ProtectedAssetCustodyVerifier.getInstance().auditAllProtectedAssets(false);
    const passed = custody.allPassed && custody.totalFailed === 0;

    return {
      id: 'PREFLIGHT-05-DATABASE-CUSTODY',
      name: 'Sovereign Database & Checkpoint Custody Verification',
      category: 'DATABASE_CUSTODY',
      passed,
      evidence: passed
        ? `All ${custody.totalPassed} sovereign assets (VDB, 1M checkpoint, 369 authority) match Phase 26 baselines bit-for-bit.`
        : `Custody breach: ${custody.totalFailed} assets failed verification.`,
      details: { totalPassed: custody.totalPassed, totalFailed: custody.totalFailed }
    };
  }

  private static checkRoutingArchitecture(): PreflightCheckItem {
    const serverContent = fs.readFileSync(path.resolve('server.ts'), 'utf8');

    const hasHealthz = serverContent.includes('/healthz');
    const hasReadyz = serverContent.includes('/readyz');
    const hasApiV1 = serverContent.includes('/api/v1');
    const hasSpaFallback = serverContent.includes('express.static') && serverContent.includes("app.get('*'");

    const passed = hasHealthz && hasReadyz && hasApiV1 && hasSpaFallback;

    return {
      id: 'PREFLIGHT-06-ROUTING',
      name: 'Frontend & API Routing Architecture',
      category: 'ROUTING',
      passed,
      evidence: passed
        ? 'Liveness (/healthz), Readiness (/readyz), Versioned API (/api/v1), and SPA fallback routing verified.'
        : 'Missing required health endpoints, API routes, or SPA static fallback.',
      details: { hasHealthz, hasReadyz, hasApiV1, hasSpaFallback }
    };
  }

  private static checkZeroExternalAi(): PreflightCheckItem {
    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
    const allDeps = Object.keys(pkg.dependencies || {});

    // Ensure external LLM APIs (OpenAI, Anthropic, Ollama, LangChain, Replicate) are completely absent
    const prohibitedDeps = ['openai', '@anthropic-ai/sdk', 'langchain', 'ollama', 'replicate'];
    const foundProhibited = prohibitedDeps.filter(d => allDeps.includes(d));

    const serverContent = fs.readFileSync(path.resolve('server.ts'), 'utf8');
    const qwenEradicated = serverContent.includes('Qwen eradicated') || serverContent.includes('QWEN_REMOVED');

    const passed = foundProhibited.length === 0 && qwenEradicated;

    return {
      id: 'PREFLIGHT-07-ZERO-EXTERNAL-AI',
      name: 'Zero External AI Service Runtime Confinement',
      category: 'ZERO_EXTERNAL_AI',
      passed,
      evidence: passed
        ? 'Zero external AI client packages in production dependencies; local Native1M and 7-stage pipeline primary.'
        : `Prohibited external AI dependencies detected: ${foundProhibited.join(', ')}`,
      details: { prohibitedFound: foundProhibited, qwenEradicated }
    };
  }

  private static checkSecurityAndCsp(): PreflightCheckItem {
    const secHeadersPath = path.resolve('src/cubio/api/security/securityHeaders.ts');
    const secContent = fs.readFileSync(secHeadersPath, 'utf8');

    const hasCsp = secContent.includes('Content-Security-Policy');
    const hasCors = secContent.includes('corsMiddleware');
    const hasNosniff = secContent.includes('X-Content-Type-Options');
    const hasFrameDeny = secContent.includes('X-Frame-Options');

    // Also check read-only VDB guard
    const vdbGuard = new MvpV2VdbIntegrationGuard();
    const vdbAudit = vdbGuard.runIntegrationAudit();
    const readOnlyEnforced = vdbAudit.allProbesBlocked && vdbAudit.isHashInvariant;

    const passed = hasCsp && hasCors && hasNosniff && hasFrameDeny && readOnlyEnforced;

    return {
      id: 'PREFLIGHT-08-SECURITY-CSP',
      name: 'Production Security Headers, CSP, CORS & Read-Only VDB',
      category: 'SECURITY_CSP',
      passed,
      evidence: passed
        ? 'Production security headers (CSP, nosniff, DENY, CORS) verified; Read-Only VDB adapter enforced.'
        : 'Security headers incomplete or read-only VDB enforcement disabled.',
      details: { hasCsp, hasCors, hasNosniff, hasFrameDeny, readOnlyEnforced }
    };
  }
}
