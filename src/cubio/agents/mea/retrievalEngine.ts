/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-001 — MEA (Memory Agent)
 * src/cubio/agents/mea/retrievalEngine.ts
 *
 * Federated on-demand retrieval engine for MEA.
 * Reuses existing Project Memory, forensic indexes, VDB references,
 * and approved memory stores without duplicate databases or memory engines.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { MEAQuery, MEARetrievedItem, MEASourceType } from './types';
import { ProjectMemory } from '../../language/native/pma/projectMemory';
import { ProjectNavigator, SubsystemDefinition } from '../../language/native/pma/projectNavigator';
import { cellIdToAddress369 } from '../../../core/address369';

export interface MEAStoreDependencies {
  readonly projectMemory?: ProjectMemory;
  readonly projectNavigator?: ProjectNavigator;
  readonly customRootDir?: string;
}

export class MEARetrievalEngine {
  private readonly rootDir: string;
  private readonly projectMemory: ProjectMemory;
  private readonly projectNavigator: ProjectNavigator;

  constructor(deps?: MEAStoreDependencies) {
    this.rootDir = deps?.customRootDir || process.cwd();
    this.projectMemory = deps?.projectMemory || new ProjectMemory();
    this.projectNavigator = deps?.projectNavigator || new ProjectNavigator(this.rootDir);
  }

  /**
   * Retrieves all matching candidate items across the four authorized sources.
   */
  public async retrieveCandidates(query: MEAQuery): Promise<readonly MEARetrievedItem[]> {
    const candidates: MEARetrievedItem[] = [];

    // 1. Source: Project Memory
    const memoryItems = this.retrieveFromProjectMemory(query);
    candidates.push(...memoryItems);

    // 2. Source: Forensic Indexes & Subsystem Catalogs
    const forensicItems = this.retrieveFromForensicIndexes(query);
    candidates.push(...forensicItems);

    // 3. Source: Canonical VDB References
    const vdbItems = this.retrieveVdbReferences(query);
    candidates.push(...vdbItems);

    // 4. Source: Approved Memory Stores (e.g. Master Manifest / Checkpoint References)
    const approvedItems = this.retrieveFromApprovedStores(query);
    candidates.push(...approvedItems);

    return Object.freeze(candidates);
  }

  // ---------------------------------------------------------------------------
  // 1. PROJECT MEMORY RETRIEVAL
  // ---------------------------------------------------------------------------
  private retrieveFromProjectMemory(query: MEAQuery): MEARetrievedItem[] {
    const items: MEARetrievedItem[] = [];
    const allRecords = this.projectMemory.getAllRecords();

    for (const rec of allRecords) {
      // Subsystem filter
      if (
        query.subsystems &&
        query.subsystems.length > 0 &&
        !query.subsystems.some((s) => s.toUpperCase() === rec.subsystem.toUpperCase())
      ) {
        continue;
      }

      // Task ID filter
      if (
        query.taskIds &&
        query.taskIds.length > 0 &&
        !query.taskIds.some((t) => t.toLowerCase() === rec.taskId.toLowerCase())
      ) {
        continue;
      }

      const snippet = `Task ${rec.taskId} [${rec.subsystem}]: ${rec.userObjective}. Status: ${
        rec.finalStatus
      }, Tests: ${rec.tests.length}, Build: ${rec.build}. Files: ${rec.filesChanged.slice(0, 3).join(', ')}`;

      const byteSize = Buffer.byteLength(snippet, 'utf8');
      const estimatedTokens = Math.max(1, Math.ceil(snippet.length / 4));

      items.push({
        id: `PM_${rec.taskId}`,
        sourceType: 'PROJECT_MEMORY',
        sourcePathOrKey: `ProjectMemory:${rec.taskId}`,
        title: `PMA Task Record: ${rec.taskId} (${rec.subsystem})`,
        snippet,
        relevanceScore: 0.8,
        byteSize,
        estimatedTokens,
        provenanceHash: rec.recordHash,
        timestamp: rec.date,
        metadata: Object.freeze({
          taskId: rec.taskId,
          subsystem: rec.subsystem,
          finalStatus: rec.finalStatus,
          invariantStatus: rec.invariantStatus,
          rxLifecycleId: rec.rxLifecycleId,
        }),
      });
    }

    // Retrieve relevant change watcher events
    const changeEvents = this.projectMemory.getAllChangeEvents();
    for (const ch of changeEvents) {
      if (
        query.taskIds &&
        query.taskIds.length > 0 &&
        !query.taskIds.some((t) => t.toLowerCase() === (ch.taskId || '').toLowerCase())
      ) {
        continue;
      }

      const isoTime = new Date(ch.timestamp).toISOString();
      const snippet = `File ${ch.changeType}: ${ch.path} (Scope: ${ch.scopeStatus}) at ${isoTime}`;
      const byteSize = Buffer.byteLength(snippet, 'utf8');
      const estimatedTokens = Math.max(1, Math.ceil(snippet.length / 4));

      items.push({
        id: `CH_${ch.changeId}`,
        sourceType: 'PROJECT_MEMORY',
        sourcePathOrKey: ch.path,
        title: `Filesystem Change: ${ch.path}`,
        snippet,
        relevanceScore: 0.6,
        byteSize,
        estimatedTokens,
        provenanceHash: ch.currentHash || ch.previousHash || ch.changeId,
        timestamp: isoTime,
        metadata: Object.freeze({
          taskId: ch.taskId,
          changeType: ch.changeType,
          scopeStatus: ch.scopeStatus,
          protectionStatus: ch.protectionStatus,
        }),
      });
    }

    return items;
  }

  // ---------------------------------------------------------------------------
  // 2. FORENSIC INDEXES RETRIEVAL
  // ---------------------------------------------------------------------------
  private retrieveFromForensicIndexes(query: MEAQuery): MEARetrievedItem[] {
    const items: MEARetrievedItem[] = [];

    // Query Subsystem Catalog from ProjectNavigator
    const targetSubsystems = query.subsystems || [];
    const allSubsystems: SubsystemDefinition[] = [];

    const navAny = this.projectNavigator as any;
    if (navAny.subsystems && typeof navAny.subsystems.values === 'function') {
      for (const def of navAny.subsystems.values()) {
        allSubsystems.push(def);
      }
    }

    for (const sub of allSubsystems) {
      if (
        targetSubsystems.length > 0 &&
        !targetSubsystems.some((ts) => ts.toUpperCase() === sub.id.toUpperCase())
      ) {
        continue;
      }

      const snippet = `Subsystem [${sub.id}] ${sub.name}: Dir: ${sub.primaryDir}, KeyFiles: ${
        sub.keyFiles.slice(0, 3).join(', ')
      }, Frozen: ${sub.isFrozen}. Keywords: ${sub.keywords.slice(0, 4).join(', ')}`;

      const byteSize = Buffer.byteLength(snippet, 'utf8');
      const estimatedTokens = Math.max(1, Math.ceil(snippet.length / 4));
      const provHash = crypto.createHash('sha256').update(`SUB_${sub.id}_${sub.primaryDir}`).digest('hex');

      items.push({
        id: `INDEX_SUB_${sub.id}`,
        sourceType: 'FORENSIC_INDEX',
        sourcePathOrKey: sub.primaryDir,
        title: `Subsystem Catalog: ${sub.name}`,
        snippet,
        relevanceScore: 0.7,
        byteSize,
        estimatedTokens,
        provenanceHash: provHash,
        timestamp: '2026-09-16T00:00:00.000Z',
        metadata: Object.freeze({
          subsystem: sub.id,
          primaryDir: sub.primaryDir,
          isFrozen: sub.isFrozen,
        }),
      });
    }

    // Check Master Index file summary
    const masterIndexPath = path.join(this.rootDir, '3D_MEMORY_STUDIO_MASTER_INDEX.md');
    if (fs.existsSync(masterIndexPath)) {
      const stats = fs.statSync(masterIndexPath);
      const snippet = `Master System Index: 3D Memory Studio hierarchy, certified Phase 8 frozen baseline, 26,605 repository artifacts index.`;
      const provHash = crypto.createHash('sha256').update(`MASTER_INDEX_${stats.size}`).digest('hex');

      items.push({
        id: 'INDEX_MASTER_SYS',
        sourceType: 'FORENSIC_INDEX',
        sourcePathOrKey: '3D_MEMORY_STUDIO_MASTER_INDEX.md',
        title: 'Master System Index & Architecture Hub',
        snippet,
        relevanceScore: 0.65,
        byteSize: Buffer.byteLength(snippet, 'utf8'),
        estimatedTokens: Math.ceil(snippet.length / 4),
        provenanceHash: provHash,
        timestamp: stats.mtime.toISOString(),
        metadata: Object.freeze({
          sizeBytes: stats.size,
          category: 'FORENSIC_ROOT',
        }),
      });
    }

    return items;
  }

  // ---------------------------------------------------------------------------
  // 3. CANONICAL VDB REFERENCES RETRIEVAL
  // ---------------------------------------------------------------------------
  private retrieveVdbReferences(query: MEAQuery): MEARetrievedItem[] {
    const items: MEARetrievedItem[] = [];
    const dbPath = path.join(this.rootDir, 'data', 'cubio_studio.db');

    if (!fs.existsSync(dbPath)) {
      return items;
    }

    const stats = fs.statSync(dbPath);
    const dbFrozenHash = 'E8CB4147DD1DCF73B29FB0EF270B75EFD3B93598F3130D0625F9ED4A0DF2C493';

    let spatialAddr: string | undefined = query.address369 ? String(query.address369) : undefined;
    let targetCell = query.cellId;

    if (targetCell !== undefined && !spatialAddr) {
      spatialAddr = String(cellIdToAddress369(targetCell));
    }

    const snippet = `Canonical SQLite Sparse Memory VDB Reference: cubio_studio.db (77,824 B, 145 records). Authority for canonical vectors & spatial addresses. Address: ${
      spatialAddr || 'GLOBAL_REF'
    }, Cell: ${targetCell !== undefined ? targetCell : 'ALL'}.`;

    const byteSize = Buffer.byteLength(snippet, 'utf8');
    const estimatedTokens = Math.max(1, Math.ceil(snippet.length / 4));

    items.push({
      id: `VDB_REF_${spatialAddr || 'CANONICAL_ROOT'}`,
      sourceType: 'VDB_REFERENCE',
      sourcePathOrKey: 'data/cubio_studio.db',
      title: 'Canonical VDB Reference Pointer',
      snippet,
      relevanceScore: targetCell !== undefined || spatialAddr ? 0.85 : 0.5,
      byteSize,
      estimatedTokens,
      provenanceHash: dbFrozenHash,
      timestamp: stats.mtime.toISOString(),
      metadata: Object.freeze({
        dbSize: stats.size,
        address369: spatialAddr || 'GLOBAL_REF',
        cellId: targetCell,
        isFrozen: true,
        accessMode: 'REFERENCE_POINTER_ONLY',
      }),
    });

    return items;
  }

  // ---------------------------------------------------------------------------
  // 4. APPROVED MEMORY STORES RETRIEVAL
  // ---------------------------------------------------------------------------
  private retrieveFromApprovedStores(query: MEAQuery): MEARetrievedItem[] {
    const items: MEARetrievedItem[] = [];

    const manifestPath = path.join(this.rootDir, 'phase8_baseline_manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestRaw);
        const snippet = `Phase 8 Certified Baseline Manifest: Status ${manifest.status}, certified subsystems: ${
          Object.keys(manifest.certified_components || {}).length
        } files frozen with SHA-256 integrity.`;

        const provHash = crypto.createHash('sha256').update(manifestRaw).digest('hex');

        items.push({
          id: 'STORE_PHASE8_MANIFEST',
          sourceType: 'APPROVED_STORE',
          sourcePathOrKey: 'phase8_baseline_manifest.json',
          title: 'Phase 8 Baseline Manifest Store Reference',
          snippet,
          relevanceScore: 0.6,
          byteSize: Buffer.byteLength(snippet, 'utf8'),
          estimatedTokens: Math.ceil(snippet.length / 4),
          provenanceHash: provHash,
          timestamp: '2026-09-15T00:00:00.000Z',
          metadata: Object.freeze({
            phase: manifest.phase,
            status: manifest.status,
          }),
        });
      } catch {
        // Safe fail-closed
      }
    }

    return items;
  }
}
