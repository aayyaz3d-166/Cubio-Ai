/**
 * 3D Interactive Viewport for Hierarchical Spatial Memory
 * Powered by Three.js
 * 
 * Supports:
 * - Multi-Block Rendering: Visually renders ROOT ├── BLOCK 0 ├── BLOCK 1 └── BLOCK 2...
 * - Block Selection & Wireframe Bounds with 3D Labeling
 * - Block Navigation: Focus Block, Focus Cell, Reset View, Show All Blocks
 * - Slice filtering, Sequence Trajectory Visualization, and 3D Sprites
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import {
  Coordinate3D,
  MemoryBlock,
  MemoryCell,
  MemoryGrid3D,
  RootMemory,
  TrajectoryPath,
} from '../types';
import { PatternRule } from '../types/patterns';
import { PatternOptimizationResult } from '../types/optimizer';
import { EncodingPlan, PlanSegment, SpatialSegmentType } from '../types/spatialEncoder';
import { ExactComparisonResult } from '../types/spatialDecoder';
import { CompositeCandidate, CompositeEntry } from '../types/spatialHierarchy';
import {
  RotateCcw,
  Compass,
  Layers,
  Eye,
  EyeOff,
  Maximize2,
  Sparkles,
  Move3d,
  Box,
  Focus,
  ZoomIn,
  Grid,
  Zap,
  Repeat,
  Shapes,
  SlidersHorizontal,
  Scale,
  TrendingDown,
  Cpu,
  Binary,
  CheckCircle2,
  FileCheck,
  Activity,
  AlertTriangle,
  Network,
} from 'lucide-react';

interface ThreeCanvasProps {
  grid: MemoryGrid3D;
  rootMemory?: RootMemory | null;
  selectedBlockId?: number | null;
  onSelectBlock?: (blockId: number | null) => void;
  selectedCellId: number | null;
  onSelectCell: (cellId: number | null) => void;
  hoveredCellId: number | null;
  onHoverCell: (cellId: number | null) => void;
  sliceAxis: 'ALL' | 'X' | 'Y' | 'Z';
  sliceIndex: number;
  showSequencePath: boolean;
  showLabels: boolean;
  showInactive: boolean;
  customTrajectoryPath?: TrajectoryPath | null;
  selectedPattern?: PatternRule | null;
  selectedOptimizerResult?: PatternOptimizationResult | null;
  selectedSegment?: PlanSegment | null;
  onSelectSegment?: (segment: PlanSegment | null) => void;
  selectedComposite?: CompositeEntry | CompositeCandidate | null;
  hierarchyMode?: 'ORIGINAL' | 'FUNNEL5' | 'FUNNEL6' | 'DIFFERENCE';
  onHierarchyModeChange?: (mode: 'ORIGINAL' | 'FUNNEL5' | 'FUNNEL6' | 'DIFFERENCE') => void;
  encodingPlan?: EncodingPlan | null;
  viewportMode?: 'ORIGINAL' | 'ENCODING_PLAN' | 'COMPACT';
  onViewportModeChange?: (mode: 'ORIGINAL' | 'ENCODING_PLAN' | 'COMPACT') => void;
  viewportDiffMode?: 'ORIGINAL' | 'DECODED' | 'DIFFERENCE';
  onViewportDiffModeChange?: (mode: 'ORIGINAL' | 'DECODED' | 'DIFFERENCE') => void;
  decodedMemory?: RootMemory | null;
  comparisonResult?: ExactComparisonResult | null;
}

// Spacing constants for 7x7x7 grid
const CELL_SPACING = 1.1;
const HALF_DIM = 3; // (7 - 1) / 2
const BLOCK_SPACING = 9.0; // Distance between block origins in 3D world

function localToWorldInBlock(
  x: number,
  y: number,
  z: number,
  blockOrigin: [number, number, number] = [0, 0, 0]
): THREE.Vector3 {
  return new THREE.Vector3(
    blockOrigin[0] + (x - HALF_DIM) * CELL_SPACING,
    blockOrigin[1] + (y - HALF_DIM) * CELL_SPACING,
    blockOrigin[2] + (z - HALF_DIM) * CELL_SPACING
  );
}

// Create Canvas Sprite for character symbol
function createTextSprite(text: string, level: number = 1): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);

    const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    const color =
      level === 1
        ? 'rgba(6, 182, 212, 0.9)'
        : level === 2
        ? 'rgba(168, 85, 247, 0.9)'
        : 'rgba(245, 158, 11, 0.9)';
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.8, 'rgba(15, 23, 42, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = level === 1 ? '#67e8f9' : level === 2 ? '#c084fc' : '#fde047';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillText(text, 64, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(0.85, 0.85, 1);
  return sprite;
}

// Create Canvas Sprite for Block Title Header
function createBlockLabelSprite(blockId: number, activeCount: number): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 256, 64);

    ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(10, 8, 236, 48, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`BLOCK #${blockId} (${activeCount}/343)`, 128, 32);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(3.2, 0.8, 1);
  return sprite;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  grid,
  rootMemory,
  selectedBlockId = null,
  onSelectBlock,
  selectedCellId,
  onSelectCell,
  hoveredCellId,
  onHoverCell,
  sliceAxis,
  sliceIndex,
  showSequencePath,
  showLabels,
  showInactive,
  customTrajectoryPath,
  selectedPattern,
  selectedOptimizerResult,
  selectedSegment,
  onSelectSegment,
  selectedComposite,
  hierarchyMode = 'FUNNEL6',
  onHierarchyModeChange,
  encodingPlan,
  viewportMode = 'ORIGINAL',
  onViewportModeChange,
  viewportDiffMode = 'ORIGINAL',
  onViewportDiffModeChange,
  decodedMemory,
  comparisonResult,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const cellMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const cellOutlinesRef = useRef<Map<string, THREE.LineSegments>>(new Map());
  const spritesRef = useRef<Map<string, THREE.Sprite>>(new Map());
  const blockBoundingBoxesRef = useRef<Map<number, THREE.LineSegments>>(new Map());
  const blockLabelsRef = useRef<Map<number, THREE.Sprite>>(new Map());
  const pathLineRef = useRef<THREE.Line | null>(null);
  const trajectoryLineRef = useRef<THREE.Line | null>(null);
  const segmentLineRef = useRef<THREE.Line | THREE.LineSegments | null>(null);

  // Composite Covered Cells Map by Block ID
  const compositeCellMap = useMemo(() => {
    const map = new Map<number, Set<number>>();
    if (!selectedComposite || !selectedComposite.occurrences) return map;
    for (const occ of selectedComposite.occurrences) {
      if (!map.has(occ.blockId)) {
        map.set(occ.blockId, new Set<number>());
      }
      const set = map.get(occ.blockId)!;
      for (const cid of occ.coveredCellIds) {
        set.add(cid);
      }
    }
    return map;
  }, [selectedComposite]);

  // Mismatch Map for difference inspection
  const mismatchMap = useMemo(() => {
    const map = new Map<string, (typeof comparisonResult)['mismatches'][0]>();
    if (!comparisonResult?.mismatches) return map;
    for (const m of comparisonResult.mismatches) {
      map.set(`${m.blockId}-${m.cellId}`, m);
    }
    return map;
  }, [comparisonResult]);

  // Map each (blockId, cellId) to its covering PlanSegment
  const cellToSegmentMap = useMemo(() => {
    const map = new Map<string, PlanSegment>();
    if (!encodingPlan) return map;
    for (const bp of encodingPlan.blocks) {
      for (const seg of bp.segments) {
        for (const cid of seg.cells) {
          map.set(`${seg.blockId}-${cid}`, seg);
        }
      }
    }
    return map;
  }, [encodingPlan]);

  // Camera State
  const isDraggingRef = useRef(false);
  const isRightDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 16, theta: Math.PI / 4, phi: Math.PI / 3 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const autoRotateRef = useRef(false);
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  // Navigation telemetry state
  const [cameraCoords, setCameraCoords] = useState<{ x: number; y: number; z: number }>({
    x: 11.3,
    y: 8.0,
    z: 11.3,
  });

  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = cameraSphericalRef.current;
    const clampedPhi = Math.max(0.01, Math.min(Math.PI - 0.01, phi));
    cameraSphericalRef.current.phi = clampedPhi;

    const x = radius * Math.sin(clampedPhi) * Math.sin(theta);
    const y = radius * Math.cos(clampedPhi);
    const z = radius * Math.sin(clampedPhi) * Math.cos(theta);

    cameraRef.current.position.set(
      cameraTargetRef.current.x + x,
      cameraTargetRef.current.y + y,
      cameraTargetRef.current.z + z
    );
    cameraRef.current.lookAt(cameraTargetRef.current);
    setCameraCoords({
      x: Number((cameraTargetRef.current.x + x).toFixed(1)),
      y: Number((cameraTargetRef.current.y + y).toFixed(1)),
      z: Number((cameraTargetRef.current.z + z).toFixed(1)),
    });
  }, []);

  // Block Navigation Actions
  const handleResetView = useCallback(() => {
    cameraTargetRef.current.set(0, 0, 0);
    cameraSphericalRef.current = { radius: 16, theta: Math.PI / 4, phi: Math.PI / 3 };
    updateCameraPosition();
  }, [updateCameraPosition]);

  const handleShowAllBlocks = useCallback(() => {
    const totalBlocks = rootMemory?.blocks.length || 1;
    const centerOffset = (totalBlocks - 1) * BLOCK_SPACING * 0.5;
    cameraTargetRef.current.set(centerOffset, 0, 0);
    cameraSphericalRef.current = {
      radius: Math.max(18, totalBlocks * 12),
      theta: Math.PI / 4,
      phi: Math.PI / 3.2,
    };
    updateCameraPosition();
  }, [rootMemory, updateCameraPosition]);

  const handleFocusBlock = useCallback(
    (blockId: number) => {
      const targetBlock = rootMemory?.blocks.find((b) => b.blockId === blockId);
      const origin = targetBlock ? targetBlock.origin : [0, 0, 0];
      cameraTargetRef.current.set(origin[0], origin[1], origin[2]);
      cameraSphericalRef.current.radius = 12;
      updateCameraPosition();
    },
    [rootMemory, updateCameraPosition]
  );

  const handleFocusCell = useCallback(
    (cellId: number, blockId: number = 0) => {
      const targetBlock = rootMemory?.blocks.find((b) => b.blockId === blockId);
      const origin = targetBlock ? targetBlock.origin : [0, 0, 0];
      const cell = targetBlock ? targetBlock.cells[cellId] : grid.cells[cellId];
      if (cell) {
        const worldPos = localToWorldInBlock(cell.x, cell.y, cell.z, origin);
        cameraTargetRef.current.copy(worldPos);
        cameraSphericalRef.current.radius = 6;
        updateCameraPosition();
      }
    },
    [rootMemory, grid, updateCameraPosition]
  );

  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050507);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x06b6d4, 1.2);
    dirLight1.position.set(15, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.7);
    dirLight2.position.set(-15, -10, -15);
    scene.add(dirLight2);

    // Floor Grid
    const floorGrid = new THREE.GridHelper(40, 40, 0x2D2D2F, 0x141416);
    floorGrid.position.y = -HALF_DIM * CELL_SPACING - 0.6;
    scene.add(floorGrid);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotateRef.current) {
        cameraSphericalRef.current.theta += 0.005;
        updateCameraPosition();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [updateCameraPosition]);

  // Build / Update Hierarchical Multi-Block 3D Grid Geometry
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear old meshes
    cellMeshesRef.current.forEach((mesh) => scene.remove(mesh));
    cellMeshesRef.current.clear();

    cellOutlinesRef.current.forEach((outline) => scene.remove(outline));
    cellOutlinesRef.current.clear();

    spritesRef.current.forEach((sprite) => scene.remove(sprite));
    spritesRef.current.clear();

    blockBoundingBoxesRef.current.forEach((box) => scene.remove(box));
    blockBoundingBoxesRef.current.clear();

    blockLabelsRef.current.forEach((lbl) => scene.remove(lbl));
    blockLabelsRef.current.clear();

    if (pathLineRef.current) {
      scene.remove(pathLineRef.current);
      pathLineRef.current = null;
    }

    if (trajectoryLineRef.current) {
      scene.remove(trajectoryLineRef.current);
      trajectoryLineRef.current = null;
    }

    const boxGeom = new THREE.BoxGeometry(0.68, 0.68, 0.68);
    const boxEdges = new THREE.EdgesGeometry(boxGeom);
    const boundsSize = 6 * CELL_SPACING + 0.8;
    const singleBlockBoundsGeom = new THREE.BoxGeometry(boundsSize, boundsSize, boundsSize);
    const singleBlockBoundsEdges = new THREE.EdgesGeometry(singleBlockBoundsGeom);

    // Determine blocks to render
    const blocksToRender: MemoryBlock[] =
      viewportDiffMode === 'DECODED' && decodedMemory && decodedMemory.blocks.length > 0
        ? decodedMemory.blocks
        : rootMemory && rootMemory.blocks.length > 0
        ? rootMemory.blocks
        : [
            {
              blockId: 0,
              parentBlockId: null,
              level: 1,
              origin: [0, 0, 0],
              dimensions: [7, 7, 7],
              cells: grid.cells,
              children: [],
              metadata: {
                title: 'Block #0',
                createdAt: new Date().toISOString(),
                activeCellCount: grid.activeCellCount,
                tokenCount: grid.sequenceSteps.length,
                capacity: 343,
              },
            },
          ];

    const allTrajectoryPoints: THREE.Vector3[] = [];

    // Render Each Block
    blocksToRender.forEach((block) => {
      const isCurrentBlockSelected = selectedBlockId === block.blockId;
      const blockOrigin = block.origin || [0, 0, 0];

      // Block Bounding Wireframe Box
      const blockBoxLine = new THREE.LineSegments(
        singleBlockBoundsEdges,
        new THREE.LineBasicMaterial({
          color: isCurrentBlockSelected ? 0xa855f7 : 0x2d2d2f,
          transparent: true,
          opacity: isCurrentBlockSelected ? 0.9 : 0.4,
          linewidth: isCurrentBlockSelected ? 2 : 1,
        })
      );
      blockBoxLine.position.set(blockOrigin[0], blockOrigin[1], blockOrigin[2]);
      scene.add(blockBoxLine);
      blockBoundingBoxesRef.current.set(block.blockId, blockBoxLine);

      // Block Title Header Sprite
      const labelSprite = createBlockLabelSprite(block.blockId, block.metadata.activeCellCount);
      labelSprite.position.set(
        blockOrigin[0],
        blockOrigin[1] + HALF_DIM * CELL_SPACING + 1.2,
        blockOrigin[2]
      );
      scene.add(labelSprite);
      blockLabelsRef.current.set(block.blockId, labelSprite);

      // Selected cell's neighbor set
      const selectedCell =
        selectedCellId !== null
          ? block.cells.find((c) => c.id === selectedCellId) || grid.cells[selectedCellId]
          : null;
      const neighborIds = selectedCell ? new Set(selectedCell.neighbors.allAdjacentIds) : new Set();
      const trajectoryCellIds = customTrajectoryPath
        ? new Set(customTrajectoryPath.pathCellIds)
        : new Set();
      const patternCellIds = selectedPattern
        ? new Set(selectedPattern.validationDetails.originalCellIds)
        : selectedOptimizerResult
        ? new Set(selectedOptimizerResult.coveredCellIds)
        : selectedSegment && selectedSegment.blockId === block.blockId
        ? new Set(selectedSegment.cells)
        : new Set();

      const blockCompositeCells = compositeCellMap.get(block.blockId) || new Set<number>();

      block.cells.forEach((cell) => {
        // Check Slice Filter
        let isVisible = true;
        if (sliceAxis === 'X') isVisible = cell.x === sliceIndex;
        else if (sliceAxis === 'Y') isVisible = cell.y === sliceIndex;
        else if (sliceAxis === 'Z') isVisible = cell.z === sliceIndex;

        if (!isVisible) return;
        if (
          !showInactive &&
          cell.state === 0 &&
          selectedCellId !== cell.id &&
          !trajectoryCellIds.has(cell.id) &&
          !patternCellIds.has(cell.id) &&
          !blockCompositeCells.has(cell.id)
        )
          return;

        const worldPos = localToWorldInBlock(cell.x, cell.y, cell.z, blockOrigin);
        const isSelected = selectedCellId === cell.id && (selectedBlockId === null || selectedBlockId === block.blockId);
        const isHovered = hoveredCellId === cell.id;
        const isNeighbor = neighborIds.has(cell.id) && (selectedBlockId === null || selectedBlockId === block.blockId);
        const isTrajectoryCell = trajectoryCellIds.has(cell.id);
        const isPatternCell = patternCellIds.has(cell.id);
        const isCompositeCell = blockCompositeCells.has(cell.id);
        const isOptimizerStart = selectedOptimizerResult && selectedOptimizerResult.startCellId === cell.id;
        const isOptimizerEnd = selectedOptimizerResult && selectedOptimizerResult.endCellId === cell.id && selectedOptimizerResult.startCellId !== cell.id;
        const planSegment = cellToSegmentMap.get(`${block.blockId}-${cell.id}`);
        const isSelectedSegmentCell = selectedSegment && selectedSegment.blockId === block.blockId && selectedSegment.cells.includes(cell.id);

        let colorHex = 0x1e293b;
        let opacity = 0.25;
        let emissiveHex = 0x000000;
        let emissiveIntensity = 0;

        const cellMismatch = mismatchMap.get(`${block.blockId}-${cell.id}`);

        if (isCompositeCell) {
          colorHex = 0x10b981; // Vibrant Emerald for Level 3 Composite
          emissiveHex = 0x34d399;
          emissiveIntensity = 0.85;
          opacity = 1.0;
        } else if (viewportDiffMode === 'DIFFERENCE') {
          if (cellMismatch) {
            colorHex = 0xef4444; // Bright Red for Mismatch
            emissiveHex = 0xef4444;
            emissiveIntensity = 0.95;
            opacity = 1.0;
          } else if (cell.state === 1) {
            colorHex = 0x10b981; // Emerald for Lossless Parity Match
            emissiveHex = 0x059669;
            emissiveIntensity = 0.45;
            opacity = 0.9;
          }
        } else if (viewportDiffMode === 'DECODED') {
          if (cell.state === 1) {
            colorHex = 0x06b6d4; // Cyan/Emerald for Decoded Cells
            emissiveHex = 0x0891b2;
            emissiveIntensity = 0.5;
            opacity = 0.9;
          }
        } else if (cell.state === 1) {
          if (viewportMode === 'ENCODING_PLAN' || viewportMode === 'COMPACT') {
            // Distinct visual representation for each rule-covered region
            if (planSegment) {
              if (planSegment.type === 'SPATIAL_RUN') colorHex = 0x06b6d4; // Cyan
              else if (planSegment.type === 'REPETITION') colorHex = 0xa855f7; // Purple
              else if (planSegment.type === 'CLUSTER') colorHex = 0xf59e0b; // Amber
              else if (planSegment.type === 'REPEATED_SHAPE') colorHex = 0xec4899; // Pink
              else if (planSegment.type === 'SEQUENCE_PATH') colorHex = 0x10b981; // Emerald
              else colorHex = 0x64748b; // RAW: Slate
              opacity = 0.9;
              emissiveHex = colorHex;
              emissiveIntensity = 0.45;
            } else {
              colorHex = 0x64748b;
              opacity = 0.8;
            }
          } else {
            // Original Hierarchical Memory Mode
            if (cell.level === 1) colorHex = 0x06b6d4; // Token/Char: Cyan
            else if (cell.level === 2) colorHex = 0xa855f7; // Cluster: Purple
            else colorHex = 0xf59e0b; // Context: Amber

            opacity = 0.85;
            emissiveHex = colorHex;
            emissiveIntensity = 0.4;
          }
        }

        if (isPatternCell && selectedPattern) {
          if (selectedPattern.patternType === 'SPATIAL_RUN') {
            colorHex = 0x06b6d4;
            emissiveHex = 0x06b6d4;
          } else if (selectedPattern.patternType === 'REPETITION') {
            colorHex = 0xa855f7;
            emissiveHex = 0xa855f7;
          } else if (selectedPattern.patternType === 'CLUSTER') {
            colorHex = 0xf59e0b;
            emissiveHex = 0xf59e0b;
          } else if (selectedPattern.patternType === 'SEQUENCE_PATH') {
            colorHex = 0x10b981;
            emissiveHex = 0x10b981;
          } else {
            colorHex = 0xf43f5e;
            emissiveHex = 0xf43f5e;
          }
          opacity = 1.0;
          emissiveIntensity = 0.85;
        } else if (isPatternCell && selectedOptimizerResult) {
          if (isOptimizerStart) {
            colorHex = 0x22c55e; // Start cell: Bright Green
            emissiveHex = 0x22c55e;
          } else if (isOptimizerEnd) {
            colorHex = 0x06b6d4; // End cell: Cyan
            emissiveHex = 0x06b6d4;
          } else {
            colorHex = selectedOptimizerResult.didRuleWinOverRaw ? 0x06b6d4 : 0xf59e0b;
            emissiveHex = colorHex;
          }
          opacity = 1.0;
          emissiveIntensity = 0.85;
        } else if (isSelectedSegmentCell && selectedSegment) {
          colorHex = 0x22c55e; // Selected segment glow
          emissiveHex = 0x22c55e;
          opacity = 1.0;
          emissiveIntensity = 0.95;
        }

        if (isTrajectoryCell) {
          colorHex = 0x22c55e;
          opacity = 0.95;
          emissiveHex = 0x22c55e;
          emissiveIntensity = 0.6;
        }

        if (isNeighbor) {
          colorHex = 0x38bdf8;
          opacity = 0.7;
          emissiveHex = 0x38bdf8;
          emissiveIntensity = 0.3;
        }

        if (isHovered) {
          colorHex = 0xffffff;
          opacity = 1.0;
          emissiveHex = 0x38bdf8;
          emissiveIntensity = 0.8;
        }

        if (isSelected) {
          colorHex = 0x22c55e;
          opacity = 1.0;
          emissiveHex = 0x22c55e;
          emissiveIntensity = 1.0;
        }

        const material = new THREE.MeshStandardMaterial({
          color: colorHex,
          transparent: true,
          opacity,
          roughness: 0.2,
          metalness: 0.1,
          emissive: emissiveHex,
          emissiveIntensity,
        });

        const mesh = new THREE.Mesh(boxGeom, material);
        mesh.position.copy(worldPos);
        mesh.userData = { cellId: cell.id, blockId: block.blockId, cell };
        scene.add(mesh);
        cellMeshesRef.current.set(`${block.blockId}-${cell.id}`, mesh);

        // Edge Outline
        let outlineColor = 0x334155;
        let outlineOpacity = 0.4;

        if (isSelected) {
          outlineColor = 0x4ade80;
          outlineOpacity = 1.0;
        } else if (cell.state === 1) {
          outlineColor = cell.level === 1 ? 0x67e8f9 : 0xc084fc;
          outlineOpacity = 0.8;
        }

        const outlineLine = new THREE.LineSegments(
          boxEdges,
          new THREE.LineBasicMaterial({
            color: outlineColor,
            transparent: true,
            opacity: outlineOpacity,
          })
        );
        outlineLine.position.copy(worldPos);
        scene.add(outlineLine);
        cellOutlinesRef.current.set(`${block.blockId}-${cell.id}`, outlineLine);

        // Character Label Sprite
        if (showLabels && cell.state === 1 && cell.symbol) {
          const displayChar = cell.symbol === ' ' ? '␣' : cell.symbol;
          const sprite = createTextSprite(displayChar, cell.level);
          sprite.position.copy(worldPos);
          scene.add(sprite);
          spritesRef.current.set(`${block.blockId}-${cell.id}`, sprite);
        }
      });
    });

    // Sequence Trajectory Line across Blocks
    if (showSequencePath && grid.sequenceSteps && grid.sequenceSteps.length > 1) {
      const pathPoints: THREE.Vector3[] = [];
      grid.sequenceSteps.forEach((step) => {
        const stepBlockId = step.blockId ?? 0;
        const targetBlock = blocksToRender.find((b) => b.blockId === stepBlockId);
        const origin: [number, number, number] = targetBlock ? targetBlock.origin : [0, 0, 0];
        pathPoints.push(localToWorldInBlock(step.coordinate.x, step.coordinate.y, step.coordinate.z, origin));
      });

      if (pathPoints.length > 1) {
        const curve = new THREE.CatmullRomCurve3(pathPoints, false, 'centripetal', 0.2);
        const curvePoints = curve.getPoints(Math.max(20, pathPoints.length * 8));
        const pathGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
        const pathMaterial = new THREE.LineBasicMaterial({
          color: 0x06b6d4,
          linewidth: 2,
          transparent: true,
          opacity: 0.85,
        });
        const pathLine = new THREE.Line(pathGeometry, pathMaterial);
        scene.add(pathLine);
        pathLineRef.current = pathLine;
      }
    }

    // Spatial Pattern Trajectory or Bounding Box Overlay
    if (selectedPattern && selectedPattern.validationDetails.originalCellIds.length > 0) {
      const targetBlockId = selectedPattern.parameters.blockId ?? 0;
      const targetBlock = blocksToRender.find((b) => b.blockId === targetBlockId) || blocksToRender[0];
      const origin: [number, number, number] = targetBlock ? targetBlock.origin : [0, 0, 0];

      // Draw Trajectory line for Run / Repetition / Sequence
      if (
        selectedPattern.patternType === 'SPATIAL_RUN' ||
        selectedPattern.patternType === 'REPETITION' ||
        selectedPattern.patternType === 'SEQUENCE_PATH'
      ) {
        const patternPoints: THREE.Vector3[] = [];
        selectedPattern.validationDetails.originalCellIds.forEach((cid) => {
          const cell = targetBlock ? targetBlock.cells.find((c) => c.id === cid) : grid.cells[cid];
          if (cell) {
            patternPoints.push(localToWorldInBlock(cell.x, cell.y, cell.z, origin));
          }
        });

        if (patternPoints.length > 1) {
          const geom = new THREE.BufferGeometry().setFromPoints(patternPoints);
          const lineColor =
            selectedPattern.patternType === 'SPATIAL_RUN'
              ? 0x06b6d4
              : selectedPattern.patternType === 'REPETITION'
              ? 0xa855f7
              : 0x10b981;
          const mat = new THREE.LineBasicMaterial({
            color: lineColor,
            linewidth: 3,
            transparent: true,
            opacity: 0.95,
          });
          const patternLine = new THREE.Line(geom, mat);
          scene.add(patternLine);
        }
      }

      // Draw Bounding Box for Cluster or Shapes
      if (selectedPattern.patternType === 'CLUSTER' && selectedPattern.parameters.boundingBox) {
        const bb = selectedPattern.parameters.boundingBox as { min: Coordinate3D; max: Coordinate3D };
        const minPos = localToWorldInBlock(bb.min.x, bb.min.y, bb.min.z, origin);
        const maxPos = localToWorldInBlock(bb.max.x, bb.max.y, bb.max.z, origin);
        
        const sizeX = Math.abs(maxPos.x - minPos.x) + 0.9;
        const sizeY = Math.abs(maxPos.y - minPos.y) + 0.9;
        const sizeZ = Math.abs(maxPos.z - minPos.z) + 0.9;
        const centerPos = new THREE.Vector3(
          (minPos.x + maxPos.x) / 2,
          (minPos.y + maxPos.y) / 2,
          (minPos.z + maxPos.z) / 2
        );

        const boxGeom = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
        const boxEdgesGeom = new THREE.EdgesGeometry(boxGeom);
        const boxLine = new THREE.LineSegments(
          boxEdgesGeom,
          new THREE.LineBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.9,
            linewidth: 2,
          })
        );
        boxLine.position.copy(centerPos);
        scene.add(boxLine);
      }
    }

    // Optimizer Selected Candidate Trajectory Overlay
    if (selectedOptimizerResult && selectedOptimizerResult.coveredCellIds.length > 0) {
      const targetBlockId = selectedOptimizerResult.blockId ?? 0;
      const targetBlock = blocksToRender.find((b) => b.blockId === targetBlockId) || blocksToRender[0];
      const origin: [number, number, number] = targetBlock ? targetBlock.origin : [0, 0, 0];

      const optPoints: THREE.Vector3[] = [];
      selectedOptimizerResult.coveredCellIds.forEach((cid) => {
        const cell = targetBlock ? targetBlock.cells.find((c) => c.id === cid) : grid.cells[cid];
        if (cell) {
          optPoints.push(localToWorldInBlock(cell.x, cell.y, cell.z, origin));
        }
      });

      if (optPoints.length > 1) {
        const geom = new THREE.BufferGeometry().setFromPoints(optPoints);
        const mat = new THREE.LineBasicMaterial({
          color: selectedOptimizerResult.didRuleWinOverRaw ? 0x06b6d4 : 0xf59e0b,
          linewidth: 3,
          transparent: true,
          opacity: 0.95,
        });
        const optLine = new THREE.Line(geom, mat);
        scene.add(optLine);
      }
    }

    // Spatial Encoder Selected Plan Segment Trajectory / Bounding Box Overlay
    if (selectedSegment && selectedSegment.cells.length > 0) {
      const targetBlockId = selectedSegment.blockId ?? 0;
      const targetBlock = blocksToRender.find((b) => b.blockId === targetBlockId) || blocksToRender[0];
      const origin: [number, number, number] = targetBlock ? targetBlock.origin : [0, 0, 0];

      if (
        selectedSegment.type === 'SPATIAL_RUN' ||
        selectedSegment.type === 'REPETITION' ||
        selectedSegment.type === 'SEQUENCE_PATH' ||
        selectedSegment.type === 'RAW'
      ) {
        const segPoints: THREE.Vector3[] = [];
        selectedSegment.cells.forEach((cid) => {
          const cell = targetBlock ? targetBlock.cells.find((c) => c.id === cid) : grid.cells[cid];
          if (cell) {
            segPoints.push(localToWorldInBlock(cell.x, cell.y, cell.z, origin));
          }
        });

        if (segPoints.length > 1) {
          const geom = new THREE.BufferGeometry().setFromPoints(segPoints);
          const mat = new THREE.LineBasicMaterial({
            color:
              selectedSegment.type === 'SPATIAL_RUN'
                ? 0x06b6d4
                : selectedSegment.type === 'REPETITION'
                ? 0xa855f7
                : selectedSegment.type === 'SEQUENCE_PATH'
                ? 0x10b981
                : 0x94a3b8,
            linewidth: 3,
            transparent: true,
            opacity: 0.95,
          });
          const segLine = new THREE.Line(geom, mat);
          scene.add(segLine);
          segmentLineRef.current = segLine;
        }
      } else if (
        (selectedSegment.type === 'CLUSTER' || selectedSegment.type === 'REPEATED_SHAPE') &&
        selectedSegment.parameters &&
        selectedSegment.parameters.boundingBox
      ) {
        const bb = selectedSegment.parameters.boundingBox as { min: Coordinate3D; max: Coordinate3D };
        const minPos = localToWorldInBlock(bb.min.x, bb.min.y, bb.min.z, origin);
        const maxPos = localToWorldInBlock(bb.max.x, bb.max.y, bb.max.z, origin);

        const sizeX = Math.abs(maxPos.x - minPos.x) + 0.9;
        const sizeY = Math.abs(maxPos.y - minPos.y) + 0.9;
        const sizeZ = Math.abs(maxPos.z - minPos.z) + 0.9;
        const centerPos = new THREE.Vector3(
          (minPos.x + maxPos.x) / 2,
          (minPos.y + maxPos.y) / 2,
          (minPos.z + maxPos.z) / 2
        );

        const boxGeom = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
        const boxEdgesGeom = new THREE.EdgesGeometry(boxGeom);
        const boxLine = new THREE.LineSegments(
          boxEdgesGeom,
          new THREE.LineBasicMaterial({
            color: selectedSegment.type === 'CLUSTER' ? 0xf59e0b : 0xec4899,
            transparent: true,
            opacity: 0.9,
            linewidth: 2,
          })
        );
        boxLine.position.copy(centerPos);
        scene.add(boxLine);
        segmentLineRef.current = boxLine;
      }
    }
  }, [
    grid,
    rootMemory,
    selectedBlockId,
    selectedCellId,
    hoveredCellId,
    sliceAxis,
    sliceIndex,
    showSequencePath,
    showLabels,
    showInactive,
    customTrajectoryPath,
    selectedPattern,
    selectedOptimizerResult,
    selectedSegment,
    encodingPlan,
    viewportMode,
  ]);

  // Pointer Interaction
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = e.button === 0;
    isRightDraggingRef.current = e.button === 2;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    if (isDraggingRef.current) {
      cameraSphericalRef.current.theta -= deltaX * 0.008;
      cameraSphericalRef.current.phi -= deltaY * 0.008;
      updateCameraPosition();
    } else if (isRightDraggingRef.current) {
      cameraTargetRef.current.x -= deltaX * 0.02;
      cameraTargetRef.current.y += deltaY * 0.02;
      updateCameraPosition();
    } else {
      // Raycasting for Hover Detection
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const meshes: THREE.Object3D[] = Array.from(cellMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const topMesh = intersects[0].object;
        if (topMesh.userData && topMesh.userData.cellId !== undefined) {
          onHoverCell(topMesh.userData.cellId);
          return;
        }
      }
      onHoverCell(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const isClick =
      Math.abs(e.clientX - previousMousePositionRef.current.x) < 4 &&
      Math.abs(e.clientY - previousMousePositionRef.current.y) < 4;

    if (isClick && e.button === 0) {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const meshes: THREE.Object3D[] = Array.from(cellMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData && hit.userData.cellId !== undefined) {
          const { cellId, blockId } = hit.userData;
          if (onSelectBlock && blockId !== undefined) onSelectBlock(blockId);
          onSelectCell(cellId);
          return;
        }
      }
    }

    isDraggingRef.current = false;
    isRightDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    cameraSphericalRef.current.radius += e.deltaY * 0.015;
    cameraSphericalRef.current.radius = Math.max(3, Math.min(80, cameraSphericalRef.current.radius));
    updateCameraPosition();
  };

  return (
    <div className="relative w-full h-full min-h-[420px] bg-[#050507] rounded border border-[#222226] overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Viewport Mode Switcher & Navigation Top Bar */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-10 pointer-events-auto">
        {/* Hierarchy Navigation */}
        <div className="bg-[#0A0A0D]/90 backdrop-blur-md border border-[#222226] rounded-lg p-1 flex items-center gap-1 text-xs font-mono shadow-xl">
          <button
            onClick={handleShowAllBlocks}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              selectedBlockId === null
                ? 'bg-cyan-950/70 border border-cyan-700 text-cyan-300 font-bold'
                : 'hover:bg-[#16161A] text-gray-300'
            }`}
            title="Show all expandable memory blocks in ROOT"
          >
            <Grid className="w-3.5 h-3.5 text-cyan-400" />
            <span>ROOT</span>
          </button>

          <span className="text-gray-600">→</span>

          <button
            onClick={() => selectedBlockId !== null && handleFocusBlock(selectedBlockId)}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              selectedBlockId !== null && selectedCellId === null
                ? 'bg-purple-950/70 border border-purple-700 text-purple-300 font-bold'
                : 'hover:bg-[#16161A] text-gray-300'
            }`}
            title="Focus selected 7x7x7 block"
          >
            <Box className="w-3.5 h-3.5 text-purple-400" />
            <span>{selectedBlockId !== null ? `Block #${selectedBlockId}` : 'Blocks'}</span>
          </button>

          <span className="text-gray-600">→</span>

          <button
            onClick={() => selectedCellId !== null && handleFocusCell(selectedCellId, selectedBlockId ?? 0)}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              selectedCellId !== null
                ? 'bg-green-950/70 border border-green-700 text-green-300 font-bold'
                : 'hover:bg-[#16161A] text-gray-400'
            }`}
            title="Focus selected cell"
          >
            <Focus className="w-3.5 h-3.5 text-green-400" />
            <span>{selectedCellId !== null ? `Cell #${selectedCellId}` : 'Cell'}</span>
          </button>
        </div>

        {/* Funnel 3 Viewport Mode Switcher: Original / Decoded / Difference */}
        {onViewportDiffModeChange && (
          <div className="bg-[#0A0A0D]/90 backdrop-blur-md border border-[#222226] rounded-lg p-1 flex items-center gap-1 text-[11px] font-mono shadow-xl">
            <button
              onClick={() => onViewportDiffModeChange('ORIGINAL')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                viewportDiffMode === 'ORIGINAL'
                  ? 'bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-[#16161A]'
              }`}
              title="Original 3D Logical Memory"
            >
              <Box className="w-3 h-3 text-cyan-400" />
              <span>Original</span>
            </button>
            <button
              onClick={() => onViewportDiffModeChange('DECODED')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                viewportDiffMode === 'DECODED'
                  ? 'bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-[#16161A]'
              }`}
              title="Decoded Logical Memory from .compact3d"
            >
              <FileCheck className="w-3 h-3 text-emerald-400" />
              <span>Decoded</span>
            </button>
            <button
              onClick={() => onViewportDiffModeChange('DIFFERENCE')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                viewportDiffMode === 'DIFFERENCE'
                  ? 'bg-amber-950 border border-amber-700 text-amber-300 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-[#16161A]'
              }`}
              title="Difference Inspector between Original and Decoded"
            >
              <Activity className="w-3 h-3 text-amber-400" />
              <span>Diff ({comparisonResult?.mismatchCount ?? 0})</span>
            </button>
          </div>
        )}

        {/* Viewport Mode Switcher: Original / Encoding Plan / Compact */}
        {onViewportModeChange && (
          <div className="bg-[#0A0A0D]/90 backdrop-blur-md border border-[#222226] rounded-lg p-1 flex items-center gap-1 text-[11px] font-mono shadow-xl">
            <button
              onClick={() => onViewportModeChange('ORIGINAL')}
              className={`px-2 py-1 rounded transition-colors ${
                viewportMode === 'ORIGINAL'
                  ? 'bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-[#16161A]'
              }`}
            >
              Original Plan
            </button>
            <button
              onClick={() => onViewportModeChange('ENCODING_PLAN')}
              className={`px-2 py-1 rounded transition-colors ${
                viewportMode === 'ENCODING_PLAN'
                  ? 'bg-purple-950 border border-purple-700 text-purple-300 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-[#16161A]'
              }`}
            >
              Rules
            </button>
            <button
              onClick={() => onViewportModeChange('COMPACT')}
              className={`px-2 py-1 rounded transition-colors ${
                viewportMode === 'COMPACT'
                  ? 'bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-[#16161A]'
              }`}
            >
              .compact3d
            </button>
          </div>
        )}
      </div>

      {/* Selected Composite Structure Floating HUD (Funnel 6) */}
      {selectedComposite && (
        <div className="absolute top-16 left-3 bg-[#0A0A0D]/95 backdrop-blur-md border border-emerald-500/80 rounded-lg p-3 text-xs font-mono shadow-2xl z-10 max-w-sm space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-bold text-emerald-400 text-[11px]">
              <Network className="w-3.5 h-3.5 text-emerald-400" />
              COMPOSITE #{'compositeId' in selectedComposite ? selectedComposite.compositeId : selectedComposite.candidateId}
            </span>
            <span
              className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                selectedComposite.score.isProfitable
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-red-950 text-red-300 border border-red-800'
              }`}
            >
              {selectedComposite.score.isProfitable ? 'LEVEL 3 ACCEPTED' : 'OVERHEAD REJECTED'}
            </span>
          </div>

          <div className="text-[11px] font-mono bg-[#121217] p-2 rounded border border-[#222228] text-cyan-300 space-y-1">
            <div className="text-[10px] text-gray-400 uppercase">
              Child Patterns ({selectedComposite.canonical.childCount}):
            </div>
            <div className="text-gray-200">
              {selectedComposite.canonical.children.map((c) => `Dict#${c.childDictId}(${c.childRuleType})`).join(' + ')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#121217] p-2 rounded border border-[#222228]">
            <div>
              <span className="text-gray-500 block">Occurrences & Origin:</span>
              <strong className="text-white font-mono">
                {selectedComposite.occurrences.length} occ @ (
                {selectedComposite.occurrences[0]?.originCoord.x ?? 0},
                {selectedComposite.occurrences[0]?.originCoord.y ?? 0},
                {selectedComposite.occurrences[0]?.originCoord.z ?? 0})
              </strong>
            </div>
            <div>
              <span className="text-gray-500 block">Transform:</span>
              <strong className="text-purple-400 font-mono">TRANSLATION</strong>
            </div>
            <div>
              <span className="text-gray-500 block">Covered Cells:</span>
              <strong className="text-emerald-400 font-mono">
                {selectedComposite.occurrences.reduce((s, o) => s + o.coveredCellIds.length, 0)} cells
              </strong>
            </div>
            <div>
              <span className="text-gray-500 block">Serialized F6 Cost:</span>
              <strong className="text-cyan-400 font-mono">
                {selectedComposite.score.totalCompositeCost} B (Def:{selectedComposite.score.compositeDefinitionCost} + Ref:{selectedComposite.score.referenceCost})
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#1E1E28] text-[10px]">
            <span className="text-gray-400">
              Expanded: <span className="text-gray-200">{selectedComposite.score.expandedChildCost} B</span>
            </span>
            <strong
              className={`font-mono ${
                selectedComposite.score.actualSavings > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              Savings: {selectedComposite.score.actualSavings > 0 ? `+${selectedComposite.score.actualSavings} B` : `${selectedComposite.score.actualSavings} B`}
            </strong>
          </div>
        </div>
      )}

      {/* Selected Spatial Plan Segment Floating HUD (Funnel 2) */}
      {selectedSegment && (
        <div className="absolute top-16 left-3 bg-[#0A0A0D]/95 backdrop-blur-md border border-cyan-500/70 rounded-lg p-3 text-xs font-mono shadow-2xl z-10 max-w-sm space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-bold text-cyan-400 text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              PLAN SEGMENT: {selectedSegment.type}
            </span>
            <span className="text-[9px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-bold">
              BLOCK #{selectedSegment.blockId}
            </span>
          </div>

          <div className="text-[11px] font-mono bg-[#121217] p-2 rounded border border-[#222228] text-purple-300 break-all select-all">
            {selectedSegment.ruleSyntax}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#121217] p-2 rounded border border-[#222228]">
            <div>
              <span className="text-gray-500 block">Covered Cells:</span>
              <strong className="text-white font-mono">
                {selectedSegment.cells.length} cells (#{selectedSegment.cells[0]}..#{selectedSegment.cells[selectedSegment.cells.length - 1]})
              </strong>
            </div>
            <div>
              <span className="text-gray-500 block">Validation:</span>
              <strong className="text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                VALID (Exact Match)
              </strong>
            </div>
            <div>
              <span className="text-gray-500 block">Serialized Bytes:</span>
              <strong className="text-cyan-400 font-mono">{selectedSegment.serializedBytes} B</strong>
            </div>
            <div>
              <span className="text-gray-500 block">RAW Baseline:</span>
              <strong className="text-gray-400 font-mono">{selectedSegment.rawEquivalentBytes} B</strong>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#1E1E28] text-[10px]">
            <span className="text-gray-400">Net Savings:</span>
            <strong
              className={`font-mono ${
                selectedSegment.netSavingsBytes > 0 ? 'text-emerald-400' : 'text-gray-400'
              }`}
            >
              {selectedSegment.netSavingsBytes > 0
                ? `-${selectedSegment.netSavingsBytes} B (${selectedSegment.netSavingsPercent}%)`
                : '0 B (0%)'}
            </strong>
          </div>
        </div>
      )}

      {/* Selected Spatial Pattern Floating HUD */}
      {selectedPattern && (
        <div className="absolute top-14 left-3 bg-[#0A0A0D]/95 backdrop-blur-md border border-cyan-500/50 rounded-lg p-2.5 text-xs font-mono shadow-2xl z-10 max-w-xs space-y-1.5 pointer-events-auto">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 font-bold text-cyan-400 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              {selectedPattern.patternType.replace('_', ' ')}
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold">
              ESTIMATED
            </span>
          </div>

          <div className="text-white font-bold text-[11px] truncate">
            {selectedPattern.title}
          </div>

          <div className="text-[10px] bg-[#121215] p-1.5 rounded border border-[#2D2D2F] text-purple-300 font-mono">
            {selectedPattern.ruleSyntax}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 pt-0.5">
            <div>
              <span>Cells:</span> <strong className="text-white">{selectedPattern.validationDetails.originalCellIds.length}</strong>
            </div>
            <div>
              <span>Savings:</span> <strong className="text-emerald-400">~{selectedPattern.estimatedSavingsPercent}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* Selected Optimizer Result Floating HUD */}
      {selectedOptimizerResult && (
        <div className="absolute top-14 left-3 bg-[#0A0A0D]/95 backdrop-blur-md border border-cyan-500/60 rounded-lg p-3 text-xs font-mono shadow-2xl z-10 max-w-sm space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-bold text-cyan-400 text-[11px]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              OPTIMIZER #{selectedOptimizerResult.patternId}
            </span>
            <span className="text-[9px] bg-purple-950/90 text-purple-300 px-2 py-0.5 rounded border border-purple-800/80 font-bold animate-pulse">
              SIMULATION — NOT YET SAVED
            </span>
          </div>

          <div className="text-white font-bold text-xs truncate">
            {selectedOptimizerResult.patternTitle}
          </div>

          <div className="p-2 rounded bg-[#121216] border border-[#222228] space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Winner:</span>
              <span
                className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                  selectedOptimizerResult.didRuleWinOverRaw
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {selectedOptimizerResult.winnerType}
              </span>
            </div>

            <div className="flex items-center justify-between font-mono">
              <span className="text-gray-400">Serialized Cost:</span>
              <span className="text-white font-bold">
                {selectedOptimizerResult.winnerSerializedBytes} B{' '}
                <span className="text-gray-500 text-[10px]">
                  (vs RAW {selectedOptimizerResult.originalRawBytes} B)
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Net Savings:</span>
              <span
                className={`font-bold ${
                  selectedOptimizerResult.netSavingsBytes > 0
                    ? 'text-emerald-400'
                    : 'text-gray-400'
                }`}
              >
                -{selectedOptimizerResult.netSavingsBytes} B ({selectedOptimizerResult.netSavingsPercent}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[#1C1C22]">
              <span>
                Start: <strong className="text-green-400">#{selectedOptimizerResult.startCellId}</strong>
              </span>
              {selectedOptimizerResult.directionName && (
                <span>
                  Dir: <strong className="text-cyan-400">{selectedOptimizerResult.directionName}</strong>
                </span>
              )}
              <span>
                End: <strong className="text-cyan-400">#{selectedOptimizerResult.endCellId}</strong>
              </span>
            </div>
          </div>

          <div className="p-1.5 rounded bg-[#16161C] border border-[#2A2A32] text-purple-300 font-mono text-[10px] break-all select-all">
            {selectedOptimizerResult.winnerRuleSyntax}
          </div>
        </div>
      )}

      {/* Quick View Navigation Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#0A0A0D]/90 backdrop-blur-md border border-[#222226] rounded-lg p-1 text-xs font-mono shadow-xl z-10">
        <button
          onClick={() => {
            if (selectedBlockId !== null) handleFocusBlock(selectedBlockId);
            else handleFocusBlock(0);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#16161A] text-purple-300 transition-colors"
          title="Focus Selected Block"
        >
          <Box className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline font-bold">Focus Block</span>
        </button>

        <button
          onClick={() => {
            if (selectedCellId !== null) handleFocusCell(selectedCellId, selectedBlockId ?? 0);
          }}
          disabled={selectedCellId === null}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            selectedCellId !== null
              ? 'hover:bg-[#16161A] text-cyan-300'
              : 'opacity-40 cursor-not-allowed text-gray-600'
          }`}
          title="Focus Selected Cell"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline font-bold">Focus Cell</span>
        </button>

        <button
          onClick={handleShowAllBlocks}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#16161A] text-amber-300 transition-colors"
          title="Show All Memory Blocks"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline font-bold">Show All Blocks</span>
        </button>

        <button
          onClick={handleResetView}
          className="p-1.5 rounded hover:bg-[#16161A] text-gray-400 hover:text-white transition-colors"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-gray-500 bg-[#0A0A0D]/80 backdrop-blur-md px-3 py-1.5 rounded border border-[#222226] pointer-events-none">
        <div className="flex items-center gap-3">
          <span>
            BLOCKS:{' '}
            <strong className="text-purple-400">
              {rootMemory?.blocks.length || 1} REUSABLE (
              {(rootMemory?.blocks.length || 1) * 343} CELLS)
            </strong>
          </span>
          <span className="hidden sm:inline">
            ACTIVE:{' '}
            <strong className="text-cyan-400">
              {rootMemory?.totalActiveCells ?? grid.activeCellCount} CELLS
            </strong>
          </span>
          {selectedBlockId !== null && (
            <span className="text-purple-300 font-bold">
              [FOCUS: BLOCK #{selectedBlockId}]
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline">
            CAM: [{cameraCoords.x}, {cameraCoords.y}, {cameraCoords.z}]
          </span>
          <span className="text-gray-400">L-Drag: Rotate · R-Drag: Pan · Wheel: Zoom</span>
        </div>
      </div>
    </div>
  );
};
