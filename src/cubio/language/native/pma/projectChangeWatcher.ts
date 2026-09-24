/**
 * CUBiO AI — 3D Memory Studio
 * Task 28 — Persistent Project Change Watcher
 * src/cubio/language/native/pma/projectChangeWatcher.ts
 *
 * Lightweight, Native, Persistent Project Filesystem Observation Engine.
 * Enforces:
 * 1. Targeted observation without continuous 26,605+ file rescans
 * 2. Task-aware change classification (12 distinct categories)
 * 3. Protected system alert generation (address369, cubio_studio.db, Phase 8)
 * 4. Dependency impact analysis
 * 5. Multi-conversation safety and honest host capability reporting
 * 6. Permanent hardware actuation lockout (is_actuation_blocked = true)
 * 7. ZERO automatic reverts / zero destructive rollback of user work
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  PMAFileChangeRecord,
  PMAChangeType,
  PMAChangeClassification,
  PMAFileBaselineEntry,
  PMATaskContext,
  PMAWatcherStatus,
  PMAWatcherStatusState,
  PMADependencyImpactResult,
  PMATaskRequest,
} from './types';
import { FrozenProtectionGuard, CANONICAL_369_PATH, CANONICAL_DB_PATH } from './frozenProtectionGuard';
import { ProjectNavigator } from './projectNavigator';

export const MAX_CHANGE_QUEUE_CAPACITY = 500;

export class ProjectChangeWatcher {
  public readonly is_actuation_blocked: boolean = true;
  private readonly rootDir: string;
  private readonly frozenGuard: FrozenProtectionGuard;
  private readonly navigator: ProjectNavigator;

  private readonly trackedBaseline = new Map<string, PMAFileBaselineEntry>();
  private readonly activeTasks = new Map<string, PMATaskContext>();
  private readonly changeQueue: PMAFileChangeRecord[] = [];

  private statusState: PMAWatcherStatusState = 'WATCHER_ACTIVE';
  private lastReconciliationTime: number = Date.now();

  constructor(customRootDir?: string) {
    this.rootDir = customRootDir || process.cwd();
    this.frozenGuard = new FrozenProtectionGuard(this.rootDir);
    this.navigator = new ProjectNavigator(this.rootDir);

    this.initializeBaselineFromAuthoritativeIndex();
  }

  private normalizePath(p: string): string {
    return p.replace(/\\/g, '/').toLowerCase();
  }

  /**
   * Initializes the lightweight observation baseline using authoritative key subsystem files.
   * Does NOT recursively walk all 26,605+ files.
   */
  private initializeBaselineFromAuthoritativeIndex(): void {
    const keyFilesSet = new Set<string>();

    // 1. Protected authorities
    keyFilesSet.add(CANONICAL_369_PATH);
    keyFilesSet.add(CANONICAL_DB_PATH);
    for (const p of this.frozenGuard.getProtectedFiles()) {
      keyFilesSet.add(p);
    }

    // 2. Subsystem key files from ProjectNavigator
    for (const sub of this.navigator.getAllSubsystems()) {
      for (const f of sub.keyFiles) {
        keyFilesSet.add(f);
      }
      for (const t of sub.tests) {
        keyFilesSet.add(t);
      }
    }

    // 3. Configuration roots
    keyFilesSet.add('package.json');
    keyFilesSet.add('tsconfig.json');
    keyFilesSet.add('vite.config.ts');
    keyFilesSet.add('MASTER_INDEX.md');
    keyFilesSet.add('README_MASTER_INDEX.md');

    for (const relPath of keyFilesSet) {
      const fullPath = path.isAbsolute(relPath) ? relPath : path.join(this.rootDir, relPath);
      const norm = this.normalizePath(relPath);

      if (fs.existsSync(fullPath)) {
        try {
          const stats = fs.statSync(fullPath);
          const isProtected = this.frozenGuard.isProtected(norm);
          const classification = this.classifyInitialPath(norm, isProtected);

          this.trackedBaseline.set(norm, {
            path: relPath,
            size: stats.size,
            mtimeMs: stats.mtimeMs,
            isProtected,
            classification,
            subsystem: this.resolveFileSubsystem(norm),
          });
        } catch {
          // Skip if inaccessible
        }
      }
    }
  }

  private resolveFileSubsystem(normPath: string): string {
    if (normPath.includes('address369')) return 'SPATIAL_369';
    if (normPath.includes('cubio_studio.db')) return 'DATABASE_VDB';
    if (normPath.includes('/vision/')) return 'NATIVE_VISION';
    if (normPath.includes('/audio/')) return 'NATIVE_AUDIO';
    if (normPath.includes('/multimodal/')) return 'MULTIMODAL_FUSION';
    if (normPath.includes('/language/')) return 'ONE_LANGUAGE_NATIVE';
    if (normPath.includes('/pma/')) return 'PROJECT_MANAGER_AGENT';
    return 'GENERAL';
  }

  private classifyInitialPath(normPath: string, isProtected: boolean): PMAChangeClassification {
    if (isProtected) return 'PROTECTED';
    if (normPath.startsWith('src/test_') || normPath.includes('.test.') || normPath.includes('.spec.')) {
      return 'TEST_ARTIFACT';
    }
    if (normPath.startsWith('research/') || normPath.startsWith('experiments/')) {
      return 'RESEARCH_ARTIFACT';
    }
    if (normPath.startsWith('dist/') || normPath.endsWith('.log')) {
      return 'GENERATED';
    }
    if (normPath.includes('package.json') || normPath.includes('tsconfig.json') || normPath.includes('vite.config')) {
      return 'CONFIGURATION';
    }
    if (normPath.startsWith('src/')) {
      return 'PRODUCTION';
    }
    return 'UNKNOWN';
  }

  /**
   * Lazily computes SHA-256 for a given path or buffer.
   */
  public computeFileHash(filePath: string, contentBuffer?: Buffer | string): string {
    if (contentBuffer !== undefined) {
      const buf = typeof contentBuffer === 'string' ? Buffer.from(contentBuffer, 'utf8') : contentBuffer;
      return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
    }

    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.rootDir, filePath);
    if (!fs.existsSync(fullPath)) return '';
    try {
      const buf = fs.readFileSync(fullPath);
      return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
    } catch {
      return '';
    }
  }

  // ---------------------------------------------------------------------------
  // TASK CONTEXT LIFECYCLE
  // ---------------------------------------------------------------------------

  /**
   * Registers a task context when a user or caller invokes @PMA.
   * Records initial baseline snapshot and allowed/protected boundaries.
   */
  public startTaskContext(
    request: PMATaskRequest,
    allowedFiles: readonly string[] = [],
    conversationId?: string
  ): PMATaskContext {
    const taskId = request.requestId || `PMA_TASK_${Date.now()}`;
    const protectedFiles = this.frozenGuard.getProtectedFiles();

    // Snapshot current state for all relevant and allowed files
    const baselineSnapshot = new Map<string, PMAFileBaselineEntry>();
    for (const f of allowedFiles) {
      const norm = this.normalizePath(f);
      const entry = this.trackedBaseline.get(norm);
      if (entry) {
        baselineSnapshot.set(norm, entry);
      }
    }

    const context: PMATaskContext = Object.freeze({
      taskId,
      objective: request.userPrompt,
      startTime: Date.now(),
      allowedFiles: Object.freeze([...allowedFiles]),
      protectedFiles: Object.freeze([...protectedFiles]),
      baselineSnapshot: Object.freeze(baselineSnapshot),
      status: 'ACTIVE',
      conversationId,
    });

    this.activeTasks.set(taskId, context);
    return context;
  }

  public endTaskContext(taskId: string): PMATaskContext | undefined {
    const existing = this.activeTasks.get(taskId);
    if (!existing) return undefined;

    const completed: PMATaskContext = Object.freeze({
      ...existing,
      status: 'COMPLETED',
    });
    this.activeTasks.set(taskId, completed);
    return completed;
  }

  public getTaskContext(taskId: string): PMATaskContext | undefined {
    return this.activeTasks.get(taskId);
  }

  public getAllActiveTasks(): readonly PMATaskContext[] {
    return Object.freeze(
      Array.from(this.activeTasks.values()).filter((t) => t.status === 'ACTIVE')
    );
  }

  // ---------------------------------------------------------------------------
  // CHANGE OBSERVATION & CLASSIFICATION
  // ---------------------------------------------------------------------------

  /**
   * Observes a specific file change, classifies it against active tasks and frozen baselines,
   * evaluates dependency impacts, and appends it to the change ledger.
   *
   * CRITICAL INVARIANT: NEVER automatically reverts, overwrites, or deletes user work.
   */
  public observeFileChange(
    filePath: string,
    currentContentOrBuffer?: Buffer | string,
    options?: {
      taskId?: string;
      conversationId?: string;
      isExplicitDeletion?: boolean;
    }
  ): PMAFileChangeRecord {
    const norm = this.normalizePath(filePath);
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.rootDir, filePath);
    const timestamp = Date.now();
    const isProtected = this.frozenGuard.isProtected(norm);

    const previousEntry = this.trackedBaseline.get(norm);
    const fileExists = options?.isExplicitDeletion ? false : (currentContentOrBuffer !== undefined || fs.existsSync(fullPath));

    let changeType: PMAChangeType = 'MODIFIED_FILE';
    let currentSize = 0;
    let currentHash = '';
    let previousHash = previousEntry?.sha256;
    let previousSize = previousEntry?.size;

    if (!fileExists) {
      changeType = 'DELETED_FILE';
      currentSize = 0;
      currentHash = '';
    } else if (!previousEntry) {
      changeType = 'NEW_FILE';
      if (currentContentOrBuffer !== undefined) {
        currentSize = typeof currentContentOrBuffer === 'string' ? Buffer.byteLength(currentContentOrBuffer) : currentContentOrBuffer.length;
        currentHash = this.computeFileHash(filePath, currentContentOrBuffer);
      } else {
        const stats = fs.statSync(fullPath);
        currentSize = stats.size;
        currentHash = this.computeFileHash(filePath);
      }
    } else {
      // Existing tracked file
      if (currentContentOrBuffer !== undefined) {
        currentSize = typeof currentContentOrBuffer === 'string' ? Buffer.byteLength(currentContentOrBuffer) : currentContentOrBuffer.length;
        currentHash = this.computeFileHash(filePath, currentContentOrBuffer);
      } else {
        const stats = fs.statSync(fullPath);
        currentSize = stats.size;
        currentHash = this.computeFileHash(filePath);
      }

      if (!previousHash && previousEntry) {
        previousHash = this.computeFileHash(filePath);
      }

      if (previousSize !== currentSize) {
        changeType = 'SIZE_CHANGED';
      }
      if (previousHash && currentHash && previousHash !== currentHash) {
        changeType = 'HASH_CHANGED';
      } else if (previousSize === currentSize && previousHash === currentHash) {
        changeType = 'METADATA_CHANGED';
      } else {
        changeType = 'MODIFIED_FILE';
      }
    }

    // -------------------------------------------------------------------------
    // Change Classification (12 categories)
    // -------------------------------------------------------------------------
    let classification: PMAChangeClassification = 'UNKNOWN';
    let scopeStatus: 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'UNASSOCIATED' | 'UNKNOWN' = 'UNASSOCIATED';
    let protectionStatus: 'PROTECTED_MUTATION_ALERT' | 'NORMAL' = 'NORMAL';
    let verificationStatus: 'VERIFIED' | 'VERIFICATION_REQUIRED' | 'BLOCKED' = 'VERIFIED';

    if (isProtected) {
      classification = 'PROTECTED';
      protectionStatus = 'PROTECTED_MUTATION_ALERT';
      verificationStatus = 'BLOCKED';
    }

    const activeTask = options?.taskId
      ? this.activeTasks.get(options.taskId)
      : Array.from(this.activeTasks.values()).find((t) => t.status === 'ACTIVE');

    if (activeTask) {
      const allowedSet = new Set(activeTask.allowedFiles.map((f) => this.normalizePath(f)));
      if (allowedSet.has(norm)) {
        scopeStatus = 'IN_SCOPE';
        if (!isProtected) {
          classification = 'EXPECTED';
          verificationStatus = 'VERIFIED';
        }
      } else if (!isProtected) {
        scopeStatus = 'OUT_OF_SCOPE';
        classification = 'UNAUTHORIZED';
        verificationStatus = 'VERIFICATION_REQUIRED';
      }
    } else {
      // Changes outside an active PMA task
      scopeStatus = 'UNASSOCIATED';
      if (!isProtected) {
        classification = 'UNASSOCIATED';
        verificationStatus = 'VERIFICATION_REQUIRED';
      }
    }

    // Contextual secondary classification overrides where applicable
    if (classification === 'UNKNOWN' || classification === 'UNASSOCIATED') {
      if (norm.startsWith('src/test_') || norm.includes('.test.') || norm.includes('.spec.')) {
        classification = 'TEST_ARTIFACT';
      } else if (norm.startsWith('research/') || norm.startsWith('experiments/')) {
        classification = 'RESEARCH_ARTIFACT';
      } else if (norm.startsWith('dist/') || norm.endsWith('.log') || norm.endsWith('.temp')) {
        classification = 'GENERATED';
      } else if (norm.includes('package.json') || norm.includes('tsconfig.json') || norm.includes('vite.config')) {
        classification = 'CONFIGURATION';
      } else if (norm.startsWith('src/')) {
        classification = 'PRODUCTION';
      }
    }

    // -------------------------------------------------------------------------
    // Dependency Impact Analysis
    // -------------------------------------------------------------------------
    const dependencyImpact = this.analyzeDependencyImpact(filePath);

    // Update internal baseline entry with latest observation
    if (fileExists) {
      this.trackedBaseline.set(norm, {
        path: filePath,
        size: currentSize,
        mtimeMs: timestamp,
        sha256: currentHash || previousHash,
        classification,
        isProtected,
        subsystem: this.resolveFileSubsystem(norm),
        associatedTaskId: activeTask?.taskId,
      });
    } else {
      this.trackedBaseline.delete(norm);
    }

    const changeId = `CHG_${timestamp}_${crypto.randomBytes(4).toString('hex')}`;
    const provenance = `CUBIO_PMA_WATCHER:${norm}:${timestamp}:TYPE=${changeType}:CLASS=${classification}`;

    const record: PMAFileChangeRecord = Object.freeze({
      changeId,
      taskId: activeTask?.taskId || options?.taskId,
      conversationId: options?.conversationId || activeTask?.conversationId,
      timestamp,
      path: filePath,
      changeType,
      previousHash,
      currentHash,
      previousSize,
      currentSize,
      scopeStatus,
      classification,
      protectionStatus,
      verificationStatus,
      dependencyImpact,
      provenance,
    });

    // Enforce bounded queue capacity (Resource Discipline)
    if (this.changeQueue.length >= MAX_CHANGE_QUEUE_CAPACITY) {
      this.changeQueue.shift();
    }
    this.changeQueue.push(record);

    return record;
  }

  /**
   * Explicit rename / move event observation.
   */
  public detectRename(
    oldPath: string,
    newPath: string,
    options?: { taskId?: string; conversationId?: string }
  ): PMAFileChangeRecord {
    const timestamp = Date.now();
    const oldNorm = this.normalizePath(oldPath);
    const newNorm = this.normalizePath(newPath);

    const prevEntry = this.trackedBaseline.get(oldNorm);
    const isProtected = this.frozenGuard.isProtected(oldNorm) || this.frozenGuard.isProtected(newNorm);

    let classification: PMAChangeClassification = 'AUTHORIZED';
    let protectionStatus: 'PROTECTED_MUTATION_ALERT' | 'NORMAL' = 'NORMAL';
    let verificationStatus: 'VERIFIED' | 'VERIFICATION_REQUIRED' | 'BLOCKED' = 'VERIFIED';

    if (isProtected) {
      classification = 'PROTECTED';
      protectionStatus = 'PROTECTED_MUTATION_ALERT';
      verificationStatus = 'BLOCKED';
    }

    // Remove old, add new
    this.trackedBaseline.delete(oldNorm);
    const hash = prevEntry?.sha256 || this.computeFileHash(newPath);
    const size = prevEntry?.size || 0;

    this.trackedBaseline.set(newNorm, {
      path: newPath,
      size,
      mtimeMs: timestamp,
      sha256: hash,
      classification,
      isProtected,
      subsystem: this.resolveFileSubsystem(newNorm),
      associatedTaskId: options?.taskId,
    });

    const changeId = `CHG_REN_${timestamp}_${crypto.randomBytes(4).toString('hex')}`;
    const provenance = `CUBIO_PMA_WATCHER:RENAME:${oldNorm}->${newNorm}:${timestamp}`;

    const record: PMAFileChangeRecord = Object.freeze({
      changeId,
      taskId: options?.taskId,
      conversationId: options?.conversationId,
      timestamp,
      path: `${oldPath} -> ${newPath}`,
      changeType: 'RENAMED_FILE',
      previousHash: hash,
      currentHash: hash,
      previousSize: size,
      currentSize: size,
      scopeStatus: 'IN_SCOPE',
      classification,
      protectionStatus,
      verificationStatus,
      dependencyImpact: this.analyzeDependencyImpact(newPath),
      provenance,
    });

    if (this.changeQueue.length >= MAX_CHANGE_QUEUE_CAPACITY) {
      this.changeQueue.shift();
    }
    this.changeQueue.push(record);

    return record;
  }

  // ---------------------------------------------------------------------------
  // DEPENDENCY IMPACT ANALYSIS
  // ---------------------------------------------------------------------------

  /**
   * Analyzes dependency and downstream impacts of a changed file.
   */
  public analyzeDependencyImpact(filePath: string): PMADependencyImpactResult {
    const norm = this.normalizePath(filePath);
    const impactedSubsystems: string[] = [];

    let impactsImports = false;
    let impactsExports = false;
    let impactsEntrypoints = false;
    let impactsTests = false;
    let impactsConfiguration = false;
    let impactsSpatial369 = false;
    let impactsDatabase = false;
    const affectedFiles: string[] = [];
    const notesArr: string[] = [];

    if (norm.includes('address369.ts')) {
      impactsSpatial369 = true;
      impactedSubsystems.push('SPATIAL_369');
      notesArr.push('Critical spatial authority affected; downstream lattice mapping must be checked.');
      affectedFiles.push('src/test_spatial_343_369_mapping.ts', 'src/test_phase8_regression_lock.ts');
    }

    if (norm.includes('cubio_studio.db')) {
      impactsDatabase = true;
      impactedSubsystems.push('DATABASE_VDB');
      notesArr.push('Persistent Sparse Memory database modified.');
      affectedFiles.push('data/cubio_studio.db', 'src/test_phase8_regression_lock.ts');
    }

    if (norm.includes('package.json') || norm.includes('tsconfig.json') || norm.includes('vite.config')) {
      impactsConfiguration = true;
      impactedSubsystems.push('CONFIGURATION');
      notesArr.push('Build tooling or dependency configuration changed.');
    }

    if (norm.includes('server.ts') || norm.includes('index.html')) {
      impactsEntrypoints = true;
      impactedSubsystems.push('RUNTIME_ENTRYPOINT');
    }

    if (norm.startsWith('src/test_')) {
      impactsTests = true;
      impactedSubsystems.push('TEST_SUITE');
    }

    if (norm.startsWith('src/cubio/')) {
      impactsImports = true;
      impactsExports = true;
      const sub = this.resolveFileSubsystem(norm);
      if (!impactedSubsystems.includes(sub)) {
        impactedSubsystems.push(sub);
      }
    }

    return Object.freeze({
      impactedSubsystems: Object.freeze(impactedSubsystems),
      impactsImports,
      impactsExports,
      impactsEntrypoints,
      impactsTests,
      impactsConfiguration,
      impactsSpatial369,
      impactsDatabase,
      affectedFiles: Object.freeze(affectedFiles),
      notes: notesArr.length > 0 ? notesArr.join(' ') : 'Local scoped file change.',
    });
  }

  // ---------------------------------------------------------------------------
  // BASELINE RECONCILIATION & RECOVERY
  // ---------------------------------------------------------------------------

  /**
   * Reconciles the tracked baseline with physical disk state.
   */
  public reconcileBaseline(pathsToReconcile?: readonly string[]): {
    reconciledCount: number;
    status: PMAWatcherStatus;
  } {
    const targets = pathsToReconcile && pathsToReconcile.length > 0
      ? pathsToReconcile
      : Array.from(this.trackedBaseline.keys());

    let count = 0;
    for (const relPath of targets) {
      const norm = this.normalizePath(relPath);
      const fullPath = path.isAbsolute(relPath) ? relPath : path.join(this.rootDir, relPath);

      if (fs.existsSync(fullPath)) {
        try {
          const stats = fs.statSync(fullPath);
          const isProtected = this.frozenGuard.isProtected(norm);
          const hash = this.computeFileHash(relPath);

          this.trackedBaseline.set(norm, {
            path: relPath,
            size: stats.size,
            mtimeMs: stats.mtimeMs,
            sha256: hash,
            isProtected,
            classification: isProtected ? 'PROTECTED' : this.classifyInitialPath(norm, false),
            subsystem: this.resolveFileSubsystem(norm),
          });
          count++;
        } catch {
          // Skip
        }
      } else {
        this.trackedBaseline.delete(norm);
        count++;
      }
    }

    this.statusState = 'WATCHER_ACTIVE';
    this.lastReconciliationTime = Date.now();

    return {
      reconciledCount: count,
      status: this.getStatus(),
    };
  }

  public setWatcherState(newState: PMAWatcherStatusState): void {
    this.statusState = newState;
  }

  /**
   * Section 27 Critical Limitation:
   * Reports watcher status with clear declaration that global host conversation interception
   * is not claimed unless explicitly provided by the platform.
   */
  public getStatus(): PMAWatcherStatus {
    return Object.freeze({
      state: this.statusState,
      hostConversationHookAvailable: false,
      statusMessage:
        'NATIVE PROJECT WATCHER ACTIVE BUT HOST-LEVEL GLOBAL CONVERSATION INTERCEPTION NOT AVAILABLE',
      totalTrackedFiles: this.trackedBaseline.size,
      recentChangesCount: this.changeQueue.length,
      lastReconciliationTime: this.lastReconciliationTime,
    });
  }

  public getRecentChanges(limit: number = 50): readonly PMAFileChangeRecord[] {
    const start = Math.max(0, this.changeQueue.length - limit);
    return Object.freeze(this.changeQueue.slice(start));
  }

  public getTrackedFiles(): readonly string[] {
    return Object.freeze(Array.from(this.trackedBaseline.keys()));
  }

  public getBaselineEntry(filePath: string): PMAFileBaselineEntry | undefined {
    return this.trackedBaseline.get(this.normalizePath(filePath));
  }
}
