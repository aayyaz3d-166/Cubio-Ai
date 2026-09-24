/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 3 (F49): Vision Intelligence Types & Contracts
 *
 * Covers 5 visual input categories:
 * 1. General Images (Scenes, photography, objects)
 * 2. UI Screenshots (Controls, accessibility tree, DOM layout)
 * 3. System Diagrams (Flowcharts, UML, DAG topology)
 * 4. CAD Screenshots (3D voxel mesh, isometric vertices, wireframes)
 * 5. Documents (OCR text, structured forms, tables)
 *
 * And the 5-stage Vision Pipeline:
 * Image -> Vision Provider -> Visual Understanding -> CubiO State -> Reasoning
 */

import { CubiODimension } from '../../../types';
import { CubiOState } from '../../../state/types';
import { ProviderInfo, ProviderStatus } from '../universalTypes';
import { AdvancedReasoningReport } from '../reasoning/types';

export type VisionInputType =
  | 'GENERAL_IMAGE'
  | 'UI_SCREENSHOT'
  | 'SYSTEM_DIAGRAM'
  | 'CAD_3D_SCREENSHOT'
  | 'DOCUMENT_SCAN'
  | 'JEWELRY_IMAGE';

export interface VisualBoundingBox {
  readonly xMin: number; // 0.0 to 1.0
  readonly yMin: number;
  readonly xMax: number;
  readonly yMax: number;
  readonly label?: string;
  readonly confidence: number;
}

export interface VisualEntity {
  readonly entityId: string;
  readonly name: string;
  readonly category: string;
  readonly boundingBox?: VisualBoundingBox;
  readonly spatialCoordinates3D?: readonly [number, number, number];
  readonly attributes: Readonly<Record<string, string | number | boolean>>;
  readonly confidence: number;
}

export interface DiagramGraphNode {
  readonly nodeId: string;
  readonly label: string;
  readonly nodeType: 'START' | 'PROCESS' | 'DECISION' | 'DATABASE' | 'END';
  readonly outgoingEdges: readonly string[];
}

export interface DocumentOcrBlock {
  readonly blockIndex: number;
  readonly text: string;
  readonly confidence: number;
  readonly isHeader: boolean;
}

export interface CADSpatialMeshEstimate {
  readonly estimatedVertices: readonly (readonly [number, number, number])[];
  readonly estimatedBoundingRadius: number;
  readonly symmetryAxis?: 'X' | 'Y' | 'Z';
  readonly spatialTopology: 'CUBIC' | 'SPHERICAL' | 'TOROIDAL' | 'COMPLEX_MANIFOLD';
}

export interface VisualUnderstandingReport {
  readonly analysisId: string;
  readonly inputType: VisionInputType;
  readonly naturalDescription: string;
  readonly detectedEntities: readonly VisualEntity[];
  readonly diagramGraph?: readonly DiagramGraphNode[];
  readonly ocrBlocks?: readonly DocumentOcrBlock[];
  readonly cadMesh?: CADSpatialMeshEstimate;
  readonly dominantColors: readonly string[];
  readonly resolution: { readonly width: number; readonly height: number };
  readonly overallConfidence: number;
  readonly providerId: string;
  readonly latencyMs: number;
  readonly imageChecksum: string;
}

// ─── MASTER VISION PROVIDER CONTRACT ───────────────────────────────────────

export interface VisionAnalysisOptions {
  readonly inputTypeHint?: VisionInputType;
  readonly prompt?: string;
  readonly targetDimension?: CubiODimension;
  readonly ocrEnabled?: boolean;
}

export interface IVisionIntelligenceProvider {
  readonly providerId: string;
  readonly providerName: string;
  getInfo(): ProviderInfo;
  getStatus(): ProviderStatus;
  analyzeVisual(
    imageData: Uint8Array,
    options?: VisionAnalysisOptions
  ): Promise<Readonly<VisualUnderstandingReport>>;
}

// ─── PIPELINE RESULT CONTRACT ──────────────────────────────────────────────

export interface VisionPipelineResult {
  readonly pipelineId: string;
  readonly inputType: VisionInputType;
  readonly visualUnderstanding: VisualUnderstandingReport;
  readonly cubioState: CubiOState;
  readonly reasoningReport?: AdvancedReasoningReport;
  readonly executionTimeMs: number;
  readonly success: boolean;
  readonly pipelineChecksum: string;
  readonly timestamp: number;
}
