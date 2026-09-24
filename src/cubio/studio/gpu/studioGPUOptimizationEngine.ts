/**
 * 3D Memory Studio — Task 13
 * StudioGPUOptimizationEngine
 *
 * Canonical GPU resource lifecycle manager for the CUBiO 3D Studio.
 *
 * Principles:
 *   - disposeObject3D() — safe, shared-resource-aware recursive disposal
 *   - BoundedVisualCache — LRU <= 256 visual references; version + tenant aware
 *   - DeviceQualityAdapter — DPR cap, quality level, pixel budget
 *   - On-demand render gate — renders only when the scene is dirty
 *   - No competing identity system. No second VDB. No persistent duplication.
 *
 * Architecture:
 *   CANONICAL VDB
 *     | Canonical Identity
 *     | Memory / Derived References
 *     | 3D Studio (ThreeCanvas / CubiOCentralCube / EulerMemoryPanel)
 *     | StudioGPUOptimizationEngine  <- THIS FILE
 *     | Visual Representation (GPU)
 */

import * as THREE from 'three';
import { IS_ACTUATION_BLOCKED } from '../../intelligence/core/coreEngineContract';

export { IS_ACTUATION_BLOCKED };

// --- Constants ---

export const GPU_CACHE_MAX_SIZE = 256;
export const GPU_CACHE_MAX_DPR = 2;
export const GPU_QUALITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;

export type GPUQualityLevel = (typeof GPU_QUALITY_LEVELS)[number];

// --- Types ---

export interface VisualCacheEntry {
  /** Canonical objectId this visual was derived from */
  objectId: string;
  /** State version at the time of creation - for invalidation */
  stateVersion: number;
  /** Tenant that owns this visual reference */
  tenantId: string;
  /** The cached Three.js Object3D */
  object: THREE.Object3D;
  /** Epoch timestamp of last access (for LRU eviction) */
  lastAccessedAt: number;
}

export interface GPUDisposalStats {
  geometriesDisposed: number;
  materialsDisposed: number;
  texturesDisposed: number;
  renderTargetsDisposed: number;
  objectsTraversed: number;
}

export interface DeviceQualityProfile {
  qualityLevel: GPUQualityLevel;
  pixelRatio: number;
  /** Maximum rendered cells before LOD reduction kicks in */
  maxCellBudget: number;
  /** Whether shadow maps are enabled */
  shadowsEnabled: boolean;
  /** Antialias recommended for this device */
  antialias: boolean;
}

export interface GPUEngineStats {
  cacheSize: number;
  cacheMaxSize: number;
  evictions: number;
  disposals: GPUDisposalStats;
  renderFrames: number;
  skippedFrames: number;
  qualityProfile: DeviceQualityProfile;
}

// --- disposeObject3D: Safe recursive disposal ---

/**
 * Safely dispose a Three.js Object3D and all its descendants.
 *
 * Rules:
 *   - Geometry disposed only if NOT shared (userData.sharedGeometry !== true)
 *   - Materials disposed only if NOT shared (userData.sharedMaterial !== true)
 *   - Textures inside materials are disposed
 *   - CanvasTextures (label sprites) are disposed
 *   - No double-dispose: checks object.userData._gpuDisposed
 *   - Recursive: visits all descendants via traverse()
 */
export function disposeObject3D(
  object: THREE.Object3D,
  stats?: GPUDisposalStats
): GPUDisposalStats {
  const s: GPUDisposalStats = stats ?? {
    geometriesDisposed: 0,
    materialsDisposed: 0,
    texturesDisposed: 0,
    renderTargetsDisposed: 0,
    objectsTraversed: 0,
  };

  if (object.userData._gpuDisposed) return s;

  object.traverse((node) => {
    s.objectsTraversed++;

    // --- Geometry ---
    const mesh = node as THREE.Mesh;
    if (mesh.geometry && !node.userData.sharedGeometry) {
      const geom = mesh.geometry;
      if (geom && !geom.userData?._gpuDisposed) {
        geom.dispose();
        geom.userData = geom.userData ?? {};
        geom.userData._gpuDisposed = true;
        s.geometriesDisposed++;
      }
    }

    // --- Materials ---
    if (!node.userData.sharedMaterial) {
      const raw = mesh.material;
      if (raw) {
        const materials = Array.isArray(raw) ? raw : [raw];
        for (const mat of materials) {
          if (mat && !mat.userData?._gpuDisposed) {
            _disposeMaterialTextures(mat, s);
            mat.dispose();
            mat.userData = mat.userData ?? {};
            mat.userData._gpuDisposed = true;
            s.materialsDisposed++;
          }
        }
      }
    }

    // --- Sprites (CanvasTexture) ---
    if (node instanceof THREE.Sprite && !node.userData.sharedMaterial) {
      const spriteMat = node.material as THREE.SpriteMaterial;
      if (spriteMat && !spriteMat.userData?._gpuDisposed) {
        if (spriteMat.map && !spriteMat.map.userData?._gpuDisposed) {
          spriteMat.map.dispose();
          spriteMat.map.userData = spriteMat.map.userData ?? {};
          spriteMat.map.userData._gpuDisposed = true;
          s.texturesDisposed++;
        }
        spriteMat.dispose();
        spriteMat.userData = spriteMat.userData ?? {};
        spriteMat.userData._gpuDisposed = true;
        s.materialsDisposed++;
      }
    }
  });

  object.userData._gpuDisposed = true;
  return s;
}

/** Dispose all texture slots on a material */
function _disposeMaterialTextures(mat: THREE.Material, s: GPUDisposalStats): void {
  const textureKeys = [
    'map', 'lightMap', 'aoMap', 'emissiveMap', 'bumpMap',
    'normalMap', 'displacementMap', 'roughnessMap', 'metalnessMap',
    'alphaMap', 'envMap',
  ];

  for (const key of textureKeys) {
    const texture = (mat as unknown as Record<string, unknown>)[key] as THREE.Texture | null | undefined;
    if (texture && !texture.userData?._gpuDisposed) {
      texture.dispose();
      texture.userData = texture.userData ?? {};
      texture.userData._gpuDisposed = true;
      s.texturesDisposed++;
    }
  }

  // RenderTarget
  const rt = (mat as unknown as Record<string, unknown>)['renderTarget'] as THREE.WebGLRenderTarget | null | undefined;
  if (rt && typeof rt.dispose === 'function' && !(rt.texture?.userData?._gpuDisposed)) {
    rt.dispose();
    s.renderTargetsDisposed++;
  }
}

// --- BoundedVisualCache ---

/**
 * LRU Visual Cache - bounded at GPU_CACHE_MAX_SIZE (256) entries.
 *
 * Keys: "${tenantId}:${objectId}:${stateVersion}"
 *
 * - Version invalidation: get() returns null if stateVersion changed
 * - Tenant isolation: get() returns null for cross-tenant access
 * - Eviction: oldest lastAccessedAt entry evicted when at capacity
 */
export class BoundedVisualCache {
  private readonly entries: Map<string, VisualCacheEntry> = new Map();
  private readonly maxSize: number;
  private _evictions = 0;

  constructor(maxSize: number = GPU_CACHE_MAX_SIZE) {
    this.maxSize = maxSize;
  }

  private _key(tenantId: string, objectId: string, stateVersion: number): string {
    return `${tenantId}:${objectId}:${stateVersion}`;
  }

  /** Store a visual reference. Evicts stale versions and LRU entry when full. */
  public set(tenantId: string, objectId: string, stateVersion: number, object: THREE.Object3D): void {
    // Evict stale versions for same tenant+objectId
    for (const [k, v] of this.entries) {
      if (v.tenantId === tenantId && v.objectId === objectId && v.stateVersion !== stateVersion) {
        disposeObject3D(v.object);
        this.entries.delete(k);
      }
    }

    // Enforce capacity
    if (this.entries.size >= this.maxSize) {
      this._evictLRU();
    }

    const key = this._key(tenantId, objectId, stateVersion);
    this.entries.set(key, { objectId, stateVersion, tenantId, object, lastAccessedAt: Date.now() });
  }

  /** Retrieve a cached visual. Returns null on miss, stale version, or tenant mismatch. */
  public get(tenantId: string, objectId: string, stateVersion: number): THREE.Object3D | null {
    const key = this._key(tenantId, objectId, stateVersion);
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.tenantId !== tenantId) return null;
    if (entry.stateVersion !== stateVersion) {
      disposeObject3D(entry.object);
      this.entries.delete(key);
      this._evictions++;
      return null;
    }
    entry.lastAccessedAt = Date.now();
    return entry.object;
  }

  /** Invalidate all cache entries for a given objectId */
  public invalidate(tenantId: string, objectId: string): void {
    for (const [k, v] of this.entries) {
      if (v.tenantId === tenantId && v.objectId === objectId) {
        disposeObject3D(v.object);
        this.entries.delete(k);
      }
    }
  }

  /** Invalidate all entries for a tenant */
  public invalidateTenant(tenantId: string): void {
    for (const [k, v] of this.entries) {
      if (v.tenantId === tenantId) {
        disposeObject3D(v.object);
        this.entries.delete(k);
      }
    }
  }

  /** Clear and dispose all entries */
  public disposeAll(): void {
    for (const entry of this.entries.values()) {
      disposeObject3D(entry.object);
    }
    this.entries.clear();
  }

  public get size(): number { return this.entries.size; }
  public get evictions(): number { return this._evictions; }

  private _evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [k, v] of this.entries) {
      if (v.lastAccessedAt < oldestTime) {
        oldestTime = v.lastAccessedAt;
        oldestKey = k;
      }
    }
    if (oldestKey) {
      const entry = this.entries.get(oldestKey)!;
      disposeObject3D(entry.object);
      this.entries.delete(oldestKey);
      this._evictions++;
    }
  }
}

// --- DeviceQualityAdapter ---

/** Derives a DeviceQualityProfile from the current browser environment. DPR capped at 2. */
export function deriveDeviceQualityProfile(): DeviceQualityProfile {
  const rawDPR = typeof window !== 'undefined' ? (window.devicePixelRatio ?? 1) : 1;
  const pixelRatio = Math.min(rawDPR, GPU_CACHE_MAX_DPR);
  const cores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? 2) : 2;
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  let qualityLevel: GPUQualityLevel;
  let maxCellBudget: number;

  if (isMobile || cores <= 2 || rawDPR > 3) {
    qualityLevel = 'LOW'; maxCellBudget = 100;
  } else if (cores <= 4) {
    qualityLevel = 'MEDIUM'; maxCellBudget = 200;
  } else {
    qualityLevel = 'HIGH'; maxCellBudget = 343;
  }

  return {
    qualityLevel,
    pixelRatio,
    maxCellBudget,
    shadowsEnabled: qualityLevel === 'HIGH',
    antialias: qualityLevel !== 'LOW',
  };
}

/** Apply a quality profile to an existing WebGLRenderer. Does NOT create a new renderer. */
export function applyQualityProfileToRenderer(renderer: THREE.WebGLRenderer, profile: DeviceQualityProfile): void {
  renderer.setPixelRatio(profile.pixelRatio);
  renderer.shadowMap.enabled = profile.shadowsEnabled;
}

// --- On-Demand Render Gate ---

/**
 * Lightweight dirty-flag for on-demand rendering.
 * markDirty() -> call in scene update
 * needsRender() -> check in RAF callback
 * markClean() -> call after rendering
 */
export class RenderDirtyFlag {
  private _dirty = true; // Start dirty to ensure first frame renders
  private _reason = 'initial';

  public markDirty(reason = 'update'): void { this._dirty = true; this._reason = reason; }
  public needsRender(): boolean { return this._dirty; }
  public markClean(): void { this._dirty = false; }
  public get reason(): string { return this._reason; }
}

// --- StudioGPUOptimizationEngine ---

/**
 * Central GPU optimization controller for the CUBiO 3D Studio.
 *
 * Responsibilities:
 *   1. Bounded visual cache (LRU <= 256, version-safe, tenant-isolated)
 *   2. Safe Object3D disposal via disposeObject3D()
 *   3. Device quality profiling and renderer adaptation
 *   4. On-demand render gate (dirty flag)
 *   5. Aggregate disposal stats for verification gates
 *
 * This engine does NOT:
 *   - Manage VDB, canonical identity, or object state
 *   - Replace renderer host lifecycle (funnel55)
 *   - Create new renderers
 *   - Persist data
 */
export class StudioGPUOptimizationEngine {
  public readonly visualCache: BoundedVisualCache;
  public readonly renderDirtyFlag: RenderDirtyFlag;
  public readonly qualityProfile: DeviceQualityProfile;

  private readonly _disposalStats: GPUDisposalStats = {
    geometriesDisposed: 0,
    materialsDisposed: 0,
    texturesDisposed: 0,
    renderTargetsDisposed: 0,
    objectsTraversed: 0,
  };

  private _renderFrames = 0;
  private _skippedFrames = 0;
  private _isDisposed = false;

  constructor(options?: { cacheMaxSize?: number; qualityProfile?: DeviceQualityProfile }) {
    if (IS_ACTUATION_BLOCKED !== true) {
      throw new Error('SECURITY VIOLATION: IS_ACTUATION_BLOCKED must be true in StudioGPUOptimizationEngine.');
    }
    this.visualCache = new BoundedVisualCache(options?.cacheMaxSize ?? GPU_CACHE_MAX_SIZE);
    this.renderDirtyFlag = new RenderDirtyFlag();
    this.qualityProfile = options?.qualityProfile ?? deriveDeviceQualityProfile();
  }

  /** Apply quality profile to a renderer. Call once after renderer creation. */
  public configureRenderer(renderer: THREE.WebGLRenderer): void {
    this._assertNotDisposed();
    applyQualityProfileToRenderer(renderer, this.qualityProfile);
  }

  /** Safely dispose a Three.js Object3D and accumulate disposal stats. */
  public disposeObject(object: THREE.Object3D): GPUDisposalStats {
    this._assertNotDisposed();
    const stats = disposeObject3D(object);
    this._disposalStats.geometriesDisposed += stats.geometriesDisposed;
    this._disposalStats.materialsDisposed += stats.materialsDisposed;
    this._disposalStats.texturesDisposed += stats.texturesDisposed;
    this._disposalStats.renderTargetsDisposed += stats.renderTargetsDisposed;
    this._disposalStats.objectsTraversed += stats.objectsTraversed;
    this.renderDirtyFlag.markDirty('dispose');
    return stats;
  }

  /**
   * Called from RAF callback. Returns true if a render should be issued.
   * Tracks frame stats for verification.
   */
  public shouldRender(): boolean {
    this._assertNotDisposed();
    if (this.renderDirtyFlag.needsRender()) {
      this._renderFrames++;
      this.renderDirtyFlag.markClean();
      return true;
    }
    this._skippedFrames++;
    return false;
  }

  /** Mark the scene dirty (will render on next RAF tick) */
  public markDirty(reason?: string): void {
    this._assertNotDisposed();
    this.renderDirtyFlag.markDirty(reason);
  }

  /** Store a visual reference in the bounded cache */
  public cacheVisual(tenantId: string, objectId: string, stateVersion: number, object: THREE.Object3D): void {
    this._assertNotDisposed();
    this.visualCache.set(tenantId, objectId, stateVersion, object);
    this.renderDirtyFlag.markDirty('cache-set');
  }

  /** Retrieve a cached visual. Returns null on miss, stale version, or tenant mismatch. */
  public getCachedVisual(tenantId: string, objectId: string, stateVersion: number): THREE.Object3D | null {
    this._assertNotDisposed();
    return this.visualCache.get(tenantId, objectId, stateVersion);
  }

  /** Invalidate all cached visuals for an object (e.g. stateVersion change) */
  public invalidateVisual(tenantId: string, objectId: string): void {
    this._assertNotDisposed();
    this.visualCache.invalidate(tenantId, objectId);
    this.renderDirtyFlag.markDirty('invalidate');
  }

  /** Invalidate all cached visuals for a tenant (tenant switch / logout) */
  public invalidateTenant(tenantId: string): void {
    this._assertNotDisposed();
    this.visualCache.invalidateTenant(tenantId);
    this.renderDirtyFlag.markDirty('tenant-invalidate');
  }

  /** Aggregate engine statistics for verification gates */
  public getStats(): GPUEngineStats {
    return {
      cacheSize: this.visualCache.size,
      cacheMaxSize: GPU_CACHE_MAX_SIZE,
      evictions: this.visualCache.evictions,
      disposals: { ...this._disposalStats },
      renderFrames: this._renderFrames,
      skippedFrames: this._skippedFrames,
      qualityProfile: { ...this.qualityProfile },
    };
  }

  /** Dispose the engine and all cached visuals */
  public dispose(): void {
    if (this._isDisposed) return;
    this._isDisposed = true;
    this.visualCache.disposeAll();
  }

  public get isDisposed(): boolean { return this._isDisposed; }

  private _assertNotDisposed(): void {
    if (this._isDisposed) throw new Error('StudioGPUOptimizationEngine: operation on disposed engine');
  }
}

// --- Scene Clear Helpers ---

/**
 * Remove and dispose all objects from a Map tracking scene objects.
 * Use this in geometry useEffect cleanup to replace the manual scene.remove()
 * calls that previously left GPU memory unreclaimed.
 *
 * @param scene    The Three.js Scene to remove objects from
 * @param meshMap  Map of key -> Three.js Object3D
 * @param engine   Optional engine for stats aggregation
 * @param shared   If true, geometry/material disposal is skipped (shared resource)
 */
export function clearAndDisposeSceneMap(
  scene: THREE.Scene,
  meshMap: Map<string | number, THREE.Object3D>,
  engine?: StudioGPUOptimizationEngine,
  shared = false
): void {
  meshMap.forEach((obj) => {
    scene.remove(obj);
    if (!shared) {
      if (engine) {
        engine.disposeObject(obj);
      } else {
        disposeObject3D(obj);
      }
    }
  });
  meshMap.clear();
}

/**
 * Remove and dispose a single nullable scene object.
 * Replaces: if (ref.current) { scene.remove(ref.current); ref.current = null; }
 */
export function clearAndDisposeSingle(
  scene: THREE.Scene,
  obj: THREE.Object3D | null | undefined,
  engine?: StudioGPUOptimizationEngine
): void {
  if (!obj) return;
  scene.remove(obj);
  if (engine) {
    engine.disposeObject(obj);
  } else {
    disposeObject3D(obj);
  }
}