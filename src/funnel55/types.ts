/**
 * 3D Memory Studio — Funnel 55
 * Actual 3D Renderer Foundation Types
 *
 * Strongly typed definitions for renderer host, lifecycle, capabilities,
 * scene layers, renderable objects, camera, resource registry, and research tests.
 */

import { SimulationDimension, SimulationSpeed } from '../funnel52/types';
import { DimensionalInformationState } from '../funnel49/types';

export type RendererBackendType = 'WEBGL' | 'CANVAS2D' | 'HEADLESS_MOCK';

export type RendererQuality = 'LOW' | 'MEDIUM' | 'HIGH' | 'AUTO';

export type RendererLifecycleState =
  | 'UNINITIALIZED'
  | 'INITIALIZED'
  | 'ATTACHED'
  | 'RUNNING'
  | 'PAUSED'
  | 'DISPOSED';

export type SceneLayerId =
  | 'CORE_LAYER'
  | 'STATE_LAYER'
  | 'RELATIONSHIP_LAYER'
  | 'CLUSTER_LAYER'
  | 'DIMENSION_LAYER'
  | 'EFFECTS_LAYER'
  | 'OVERLAY_LAYER';

export interface RendererCapabilities {
  readonly webglAvailable: boolean;
  readonly webglVersion: number;
  readonly rendererType: RendererBackendType;
  readonly maxTextureSize: number;
  readonly devicePixelRatio: number;
  readonly maxBoundedDpr: number;
  readonly recommendedQuality: RendererQuality;
  readonly prefersReducedMotion: boolean;
  readonly fallbackRequired: boolean;
}

export interface RendererViewport {
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
  readonly aspect: number;
}

export interface RendererStats {
  readonly fps: number;
  readonly frameTimeMs: number;
  readonly frameDeltaMs: number;
  readonly renderCalls: number;
  readonly activeObjects: number;
  readonly activeResources: number;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly dpr: number;
  readonly quality: RendererQuality;
  readonly rendererType: RendererBackendType;
  readonly webglAvailable: boolean;
}

export interface RendererCameraConfig {
  readonly fov: number;
  readonly aspect: number;
  readonly near: number;
  readonly far: number;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly zoom: number;
}

export interface DisposableResource {
  readonly id: string;
  readonly type: 'GEOMETRY' | 'MATERIAL' | 'TEXTURE' | 'BUFFER' | 'RENDER_TARGET' | 'CUSTOM';
  readonly dispose: () => void;
  readonly isDisposed: boolean;
}

export interface RenderableObject {
  readonly id: string;
  readonly layerId: SceneLayerId;
  visible: boolean;
  opacity: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  readonly sourceState?: DimensionalInformationState;
  update(deltaMs: number, timeMs: number): void;
  render(context: unknown): void;
  dispose(): void;
}

export interface SceneLayer {
  readonly id: SceneLayerId;
  readonly name: string;
  visible: boolean;
  opacity: number;
  readonly objects: readonly RenderableObject[];
  addObject(obj: RenderableObject): void;
  removeObject(objId: string): void;
  clear(): void;
  update(deltaMs: number, timeMs: number): void;
  render(context: unknown): void;
  dispose(): void;
}

export interface F55TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly variance?: number;
}

export interface F55SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F55TestResult[];
}

export interface ProjectedObjectDiagnostic {
  readonly objectId: string;
  readonly authoritativePosition: readonly [number, number, number];
  readonly projectedWorldPosition: readonly [number, number, number];
  readonly screenPosition: readonly [number, number];
  readonly collisionOffset: readonly [number, number];
  readonly visible: boolean;
  readonly selected: boolean;
}
