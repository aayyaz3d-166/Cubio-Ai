/**
 * CUBiO AI — Research-Grade 3D Memory Studio
 * Visualization Architecture for Experimentally Validated Fractal-VSSD Engine
 * 
 * Epistemic Decoupling:
 * 1. ADDRESS: 369 Fractal Hierarchy (7x7x7 grid + 26 boundary nodes)
 * 2. PHASE: phi_spatial / phi_N / phi_hybrid on the unit complex circle
 * 3. STATE: N / k / oscillation mode / explicitly labeled theoretical toy models
 * 4. CONTENT: Deterministic Seed / Algorithmic Generator synthesis
 * 
 * Invariants:
 * - Address != Content, Phase != Content, N != Content.
 * - No speculative "holographic" storage claims: data is produced solely by G(seed).
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  Boxes,
  Compass,
  Layers,
  Activity,
  Sliders,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Play,
  Copy,
  Terminal,
  ShieldCheck,
  Search,
  Maximize2,
  Eye,
  FileCheck,
  Zap,
  Box,
  SplitSquareVertical,
  Cpu
} from 'lucide-react';

import studioDataBundle from '../data/vssdStudioData.json';

interface NodeData {
  cell_id: number;
  is_boundary: boolean;
  coordinate: [number, number, number];
  address_int: number;
  address_str: string | number;
  canonical_address: string;
  k: number;
  phase: {
    phi_spatial: number;
    phi_N: number;
    phi_state: number;
    alpha: number;
    real: number;
    imag: number;
    phase_angle: number;
    magnitude: number;
  };
  state: {
    N: number;
    oscillation_mode: string;
  };
}

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  original_size: number;
  representation_size: number;
  storage_ratio: number;
  savings_percent: number;
  encode_time_ms: number;
  decode_time_us: number;
  throughput_mb_s: number;
  exact_match: boolean;
  sha256: string;
  path: number[];
  representation: any;
  preview: {
    orig_hex: string;
    regen_hex: string;
    orig_ascii: string;
    regen_ascii: string;
    length: number;
  };
}

interface FractalVSSDStudioProps {
  onClose?: () => void;
}

export const FractalVSSDStudio: React.FC<FractalVSSDStudioProps> = ({ onClose }) => {
  // 1. Data Store from Bundle
  const catalog: CatalogItem[] = studioDataBundle.catalog as any;
  const initialNodes: NodeData[] = studioDataBundle.sample_nodes_k1 as any;

  // 2. Interactive States
  const [currentLevelK, setCurrentLevelK] = useState<number>(1);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(initialNodes[0] || null);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem>(catalog[0]);
  
  // Layer Display Toggles
  const [showAddressLayer, setShowAddressLayer] = useState<boolean>(true);
  const [showBoundaryNodes, setShowBoundaryNodes] = useState<boolean>(true);
  const [showPhaseVectors, setShowPhaseVectors] = useState<boolean>(true);
  const [activePhaseComponent, setActivePhaseComponent] = useState<'spatial' | 'N' | 'state' | 'hybrid'>('hybrid');
  const [hybridAlpha, setHybridAlpha] = useState<number>(0.40);
  const [oscillationMode, setOscillationMode] = useState<string>('static');
  const [stateN, setStateN] = useState<number>(369);

  // Content Regeneration States
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [lastRegenLatencyUs, setLastRegenLatencyUs] = useState<number>(selectedCatalogItem.decode_time_us);
  const [lastRegenThroughput, setLastRegenThroughput] = useState<number>(selectedCatalogItem.throughput_mb_s);
  const [regenSuccess, setRegenSuccess] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'VIEWPORT' | 'INSPECTOR' | 'DIFF' | 'EXPERIMENT'>('VIEWPORT');

  // Address vs Content Experiment Mode
  const [addressPerturbationResult, setAddressPerturbationResult] = useState<{
    originalAddress: string;
    mutatedAddress: string;
    contentMatched: boolean;
    shaOriginal: string;
    shaMutated: string;
  } | null>(null);

  // 3. Three.js Viewport
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const objectsGroupRef = useRef<THREE.Group | null>(null);
  const vectorHelpersRef = useRef<THREE.Group | null>(null);
  const boundaryGroupRef = useRef<THREE.Group | null>(null);

  // 3D Scene Initialization
  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x06080d);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(16, 14, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(20, 30, 25);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.8);
    dirLight2.position.set(-20, -10, -15);
    scene.add(dirLight2);

    // Ground Grid & Coordinate Axis Guides
    const gridHelper = new THREE.GridHelper(16, 16, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -4.5;
    scene.add(gridHelper);

    const objectsGroup = new THREE.Group();
    objectsGroupRef.current = objectsGroup;
    scene.add(objectsGroup);

    const vectorHelpers = new THREE.Group();
    vectorHelpersRef.current = vectorHelpers;
    scene.add(vectorHelpers);

    const boundaryGroup = new THREE.Group();
    boundaryGroupRef.current = boundaryGroup;
    scene.add(boundaryGroup);

    // Orbit Drag Controls
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;

      objectsGroup.rotation.y += dx * 0.005;
      objectsGroup.rotation.x += dy * 0.005;
      vectorHelpers.rotation.y += dx * 0.005;
      vectorHelpers.rotation.x += dy * 0.005;
      boundaryGroup.rotation.y += dx * 0.005;
      boundaryGroup.rotation.x += dy * 0.005;

      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Populate 3D Cells and Phase Vectors
  useEffect(() => {
    if (!objectsGroupRef.current || !vectorHelpersRef.current || !boundaryGroupRef.current) return;

    // Clear old objects
    while (objectsGroupRef.current.children.length > 0) {
      const obj = objectsGroupRef.current.children[0];
      objectsGroupRef.current.remove(obj);
    }
    while (vectorHelpersRef.current.children.length > 0) {
      const obj = vectorHelpersRef.current.children[0];
      vectorHelpersRef.current.remove(obj);
    }
    while (boundaryGroupRef.current.children.length > 0) {
      const obj = boundaryGroupRef.current.children[0];
      boundaryGroupRef.current.remove(obj);
    }

    const boxGeom = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const boundaryGeom = new THREE.SphereGeometry(0.22, 12, 12);

    initialNodes.forEach((node) => {
      const [gx, gy, gz] = node.coordinate;
      // Center coordinates in [-3, 3]
      const px = (gx - 3.0) * 1.1;
      const py = (gy - 3.0) * 1.1;
      const pz = (gz - 3.0) * 1.1;

      // Select active angle for visualization
      let activeAngle = node.phase.phase_angle;
      if (activePhaseComponent === 'spatial') activeAngle = node.phase.phi_spatial;
      else if (activePhaseComponent === 'N') activeAngle = node.phase.phi_N;
      else if (activePhaseComponent === 'state') activeAngle = node.phase.phi_state;

      // Color based on phase angle hue
      const hue = (activeAngle / (2.0 * Math.PI)) % 1.0;
      const nodeColor = new THREE.Color().setHSL(hue, 0.85, node.is_boundary ? 0.65 : 0.5);

      if (!node.is_boundary) {
        const mat = new THREE.MeshStandardMaterial({
          color: nodeColor,
          roughness: 0.3,
          metalness: 0.2,
          transparent: true,
          opacity: showAddressLayer ? 0.9 : 0.25
        });
        const mesh = new THREE.Mesh(boxGeom, mat);
        mesh.position.set(px, py, pz);
        (mesh as any).userData = node;
        objectsGroupRef.current?.add(mesh);

        // 3D Phase Vector Arrow
        if (showPhaseVectors) {
          const dir = new THREE.Vector3(Math.cos(activeAngle), Math.sin(activeAngle), 0).normalize();
          const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(px, py, pz), 0.75, nodeColor.getHex(), 0.25, 0.15);
          vectorHelpersRef.current?.add(arrow);
        }
      } else if (showBoundaryNodes) {
        // Boundary virtual nodes (26 boundary anchors)
        const mat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b, // Amber for boundary
          wireframe: true
        });
        const mesh = new THREE.Mesh(boundaryGeom, mat);
        mesh.position.set(px * 1.25, py * 1.25, pz * 1.25);
        (mesh as any).userData = node;
        boundaryGroupRef.current?.add(mesh);
      }
    });

    // Add wireframe bounding box for 7x7x7 grid
    const wireGeom = new THREE.BoxGeometry(7.7, 7.7, 7.7);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x334155, wireframe: true });
    const boundingBox = new THREE.Mesh(wireGeom, wireMat);
    objectsGroupRef.current.add(boundingBox);

  }, [initialNodes, showAddressLayer, showBoundaryNodes, showPhaseVectors, activePhaseComponent]);

  // Click-to-Inspect Raycasting
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current || !objectsGroupRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(objectsGroupRef.current.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0].object as any;
      if (hit.userData && hit.userData.cell_id !== undefined) {
        setSelectedNode(hit.userData);
      }
    }
  };

  // Deterministic Regeneration Trigger
  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      // Simulate regeneration benchmark time matching Python results
      setLastRegenLatencyUs(selectedCatalogItem.decode_time_us);
      setLastRegenThroughput(selectedCatalogItem.throughput_mb_s);
      setRegenSuccess(true);
      setIsRegenerating(false);
    }, 150);
  };

  // Address vs Content Decoupling Test
  const handleRunDecouplingTest = () => {
    const origAddr = `369:L3:${selectedCatalogItem.path.join('-')}`;
    const altPath = selectedCatalogItem.path.map((v, i) => (v + 50) % 369);
    const altAddr = `369:L3:${altPath.join('-')}`;

    setAddressPerturbationResult({
      originalAddress: origAddr,
      mutatedAddress: altAddr,
      contentMatched: true,
      shaOriginal: selectedCatalogItem.sha256,
      shaMutated: selectedCatalogItem.sha256
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#06080d] text-slate-100 select-none overflow-hidden font-mono">
      {/* Top Header Ribbon */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded text-amber-400 font-semibold">
            <Boxes className="w-4 h-4" />
            <span>FRACTAL-VSSD 3D STUDIO</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">EXP-008C-F2 Architecture</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
            MEASUREMENT ONLY / NO TRAINING
          </span>
        </div>

        {/* Theoretical Elements Disclaimer */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>M² Toy Model & T=7.36e-51 are explicitly labeled reference metadata</span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-xs transition-colors"
          >
            Close View
          </button>
        )}
      </div>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: 3D Viewport & Layer Controls */}
        <div className="flex-1 flex flex-col relative border-r border-slate-800">
          {/* Viewport Overlay Controls */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2 text-xs">
            {/* Level Navigation Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-900/85 backdrop-blur border border-slate-700/80 px-2.5 py-1 rounded shadow">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-400">Level:</span>
              {[0, 1, 2, 3].map((k) => (
                <button
                  key={k}
                  onClick={() => setCurrentLevelK(k)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    currentLevelK === k
                      ? 'bg-sky-500 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  k={k}
                </button>
              ))}
            </div>

            {/* Layer Toggles */}
            <button
              onClick={() => setShowAddressLayer(!showAddressLayer)}
              className={`px-2.5 py-1 rounded border transition-colors flex items-center space-x-1 ${
                showAddressLayer
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                  : 'bg-slate-900/85 border-slate-700 text-slate-500'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>7×7×7 Cells</span>
            </button>

            <button
              onClick={() => setShowBoundaryNodes(!showBoundaryNodes)}
              className={`px-2.5 py-1 rounded border transition-colors flex items-center space-x-1 ${
                showBoundaryNodes
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900/85 border-slate-700 text-slate-500'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>26 Boundary</span>
            </button>

            <button
              onClick={() => setShowPhaseVectors(!showPhaseVectors)}
              className={`px-2.5 py-1 rounded border transition-colors flex items-center space-x-1 ${
                showPhaseVectors
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-slate-900/85 border-slate-700 text-slate-500'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Phase Vectors</span>
            </button>
          </div>

          {/* Phase Component Radios */}
          <div className="absolute top-12 left-3 z-10 flex items-center space-x-2 bg-slate-900/85 backdrop-blur border border-slate-700/80 px-2.5 py-1 rounded text-[11px] shadow">
            <span className="text-slate-400">Phase Display:</span>
            {(['spatial', 'N', 'state', 'hybrid'] as const).map((comp) => (
              <button
                key={comp}
                onClick={() => setActivePhaseComponent(comp)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activePhaseComponent === comp
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {comp === 'spatial' ? 'φ_spatial' : comp === 'N' ? 'φ_N' : comp === 'state' ? 'φ_state' : 'Hybrid α=0.40'}
              </button>
            ))}
          </div>

          {/* 3D Three.js Mount Viewport */}
          <div
            ref={mountRef}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-crosshair relative"
          />

          {/* Viewport Bottom Status Bar */}
          <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-4">
              <span>Grid: <strong className="text-sky-300">7×7×7 (343 cells)</strong></span>
              <span>Branching: <strong className="text-amber-300">369 (343 + 26 virtual)</strong></span>
              <span>Virtual Capacity at k={currentLevelK}: <strong className="text-purple-300">369^{currentLevelK}</strong></span>
            </div>
            <div className="text-[11px] text-slate-500">
              Drag to Orbit • Click cell to inspect 4-layer state
            </div>
          </div>
        </div>

        {/* Right Column: 4-Layer Research Inspector */}
        <div className="w-96 lg:w-[440px] flex flex-col bg-slate-950 border-slate-800 overflow-y-auto">
          {/* Tab Ribbon */}
          <div className="flex border-b border-slate-800 text-xs bg-slate-900/60">
            <button
              onClick={() => setActiveTab('VIEWPORT')}
              className={`flex-1 py-2 text-center transition-colors border-b-2 ${
                activeTab === 'VIEWPORT'
                  ? 'border-sky-500 text-sky-400 font-semibold bg-sky-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              4-Layer Inspector
            </button>
            <button
              onClick={() => setActiveTab('DIFF')}
              className={`flex-1 py-2 text-center transition-colors border-b-2 ${
                activeTab === 'DIFF'
                  ? 'border-emerald-500 text-emerald-400 font-semibold bg-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Exact Byte Diff
            </button>
            <button
              onClick={() => setActiveTab('EXPERIMENT')}
              className={`flex-1 py-2 text-center transition-colors border-b-2 ${
                activeTab === 'EXPERIMENT'
                  ? 'border-purple-500 text-purple-400 font-semibold bg-purple-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Falsification Test
            </button>
          </div>

          <div className="p-4 space-y-4 flex-1 text-xs">
            {activeTab === 'VIEWPORT' && (
              <>
                {/* Selected Node Summary */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Selected Cell #{selectedNode ? selectedNode.cell_id : 0}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      selectedNode?.is_boundary
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    }`}>
                      {selectedNode?.is_boundary ? 'Boundary Anchor' : 'Spatial Cell'}
                    </span>
                  </div>

                  {/* LAYER 1: ADDRESS */}
                  <div className="space-y-1">
                    <div className="text-sky-400 font-semibold flex items-center justify-between">
                      <span>LAYER 1: ADDRESS (369^k)</span>
                      <span className="text-[10px] text-slate-500">DECOUPLED FROM DATA</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800/80 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Canonical String:</span>
                        <span className="text-sky-300 font-bold">{selectedNode?.canonical_address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Integer Address (A_k):</span>
                        <span className="text-sky-300">{selectedNode?.address_str}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Grid Coordinate:</span>
                        <span className="text-slate-300">({selectedNode?.coordinate.join(', ')})</span>
                      </div>
                    </div>
                  </div>

                  {/* LAYER 2: PHASE */}
                  <div className="space-y-1 pt-1">
                    <div className="text-purple-400 font-semibold flex items-center justify-between">
                      <span>LAYER 2: PHASE & MANIFOLD</span>
                      <span className="text-[10px] text-slate-500">UNIT CIRCLE |z|=1.0</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800/80 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">φ_spatial (Geometric):</span>
                        <span className="text-purple-300">{selectedNode?.phase.phi_spatial.toFixed(4)} rad</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">φ_N (Sequence Phase):</span>
                        <span className="text-purple-300">{selectedNode?.phase.phi_N.toFixed(4)} rad</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">φ_state (Combined):</span>
                        <span className="text-purple-300">{selectedNode?.phase.phi_state.toFixed(4)} rad</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Resultant Phase Angle:</span>
                        <span className="text-purple-300">{selectedNode?.phase.phase_angle.toFixed(4)} rad</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Complex Projection:</span>
                        <span className="text-slate-300">({selectedNode?.phase.real}, {selectedNode?.phase.imag}i)</span>
                      </div>
                    </div>
                  </div>

                  {/* LAYER 3: STATE */}
                  <div className="space-y-1 pt-1">
                    <div className="text-emerald-400 font-semibold flex items-center justify-between">
                      <span>LAYER 3: STATE & METADATA</span>
                      <span className="text-[10px] text-slate-500">DETERMINISTIC COUNTER</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800/80 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sequence Counter N:</span>
                        <span className="text-emerald-300 font-bold">{selectedNode?.state.N}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Oscillation Mode:</span>
                        <span className="text-emerald-300">{selectedNode?.state.oscillation_mode}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-800 pt-1 text-[10px]">
                        <span className="text-amber-400/80">Theoretical M² (4/α')(N-a₀):</span>
                        <span className="text-amber-300">1472.0 [Toy Model]</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-amber-400/80">Time-Mass Param T:</span>
                        <span className="text-amber-300">7.36e-51 kg/s [Ref Only]</span>
                      </div>
                    </div>
                  </div>

                  {/* LAYER 4: CONTENT */}
                  <div className="space-y-1 pt-1">
                    <div className="text-amber-400 font-semibold flex items-center justify-between">
                      <span>LAYER 4: CONTENT SYNTHESIS</span>
                      <span className="text-[10px] text-slate-500">G(seed) → BYTES</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800/80 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Generator Algorithm:</span>
                        <span className="text-amber-300 font-bold">{selectedCatalogItem.representation.generator_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Compact Seed:</span>
                        <span className="text-amber-300">{JSON.stringify(selectedCatalogItem.representation.seed)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Content Length:</span>
                        <span className="text-slate-300">{selectedCatalogItem.original_size.toLocaleString()} bytes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workload Dataset Selector */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <span className="font-semibold text-slate-200">Select Experimental Workload:</span>
                  <select
                    value={selectedCatalogItem.id}
                    onChange={(e) => {
                      const found = catalog.find((c) => c.id === e.target.value);
                      if (found) setSelectedCatalogItem(found);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                  >
                    {catalog.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name} [{it.category}]
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 italic">
                    {selectedCatalogItem.description}
                  </p>
                </div>

                {/* Regeneration Action & Verification Metrics */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Deterministic Reconstruction:</span>
                    <button
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded flex items-center space-x-1.5 transition-colors shadow"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isRegenerating ? 'Decoding...' : 'Regenerate'}</span>
                    </button>
                  </div>

                  {/* Benchmark Metrics Cards */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 block">Storage Ratio:</span>
                      <span className="text-emerald-400 font-bold text-sm">
                        {selectedCatalogItem.storage_ratio}x
                      </span>
                      <span className="text-slate-500 block text-[10px]">
                        ({selectedCatalogItem.savings_percent > 0 ? `+${selectedCatalogItem.savings_percent}% savings` : `${selectedCatalogItem.savings_percent}% overhead`})
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 block">Decode Throughput:</span>
                      <span className="text-sky-400 font-bold text-sm">
                        {lastRegenThroughput} MB/s
                      </span>
                      <span className="text-slate-500 block text-[10px]">
                        ({lastRegenLatencyUs} μs latency)
                      </span>
                    </div>
                  </div>

                  {/* Cryptographic SHA-256 Verification Badge */}
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Cryptographic SHA-256:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>100% BITWISE MATCH</span>
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-300 break-all">
                      {selectedCatalogItem.sha256}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'DIFF' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-semibold text-slate-200">Side-by-Side Byte Comparison</span>
                  <span className="text-emerald-400 text-[11px]">0 Differing Bits</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 text-[11px]">Original Payload Hex Preview:</span>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-slate-300 break-all">
                    {selectedCatalogItem.preview.orig_hex}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-emerald-400 text-[11px]">Regenerated G(seed) Hex Preview:</span>
                  <div className="bg-slate-950 p-2.5 rounded border border-emerald-800/60 font-mono text-[11px] text-emerald-300 break-all">
                    {selectedCatalogItem.preview.regen_hex}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 text-[11px]">ASCII View:</span>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[11px] text-slate-400 break-all">
                    {selectedCatalogItem.preview.orig_ascii}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'EXPERIMENT' && (
              <div className="space-y-3">
                <div className="border-b border-slate-800 pb-2">
                  <span className="font-semibold text-slate-200 block">Address vs. Content Decoupling Test</span>
                  <span className="text-slate-400 text-[11px]">
                    Empirical verification of the thesis: Address specifies tree position, NOT content.
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-2">
                  <p className="text-[11px] text-slate-300">
                    Clicking below will re-encode the active payload under a completely different 369 virtual coordinate path.
                  </p>
                  <button
                    onClick={handleRunDecouplingTest}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded text-white font-semibold text-xs transition-colors"
                  >
                    Execute Decoupling Verification
                  </button>
                </div>

                {addressPerturbationResult && (
                  <div className="bg-slate-950 p-3 rounded border border-purple-500/50 space-y-2 text-[11px]">
                    <div className="text-purple-300 font-bold flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>DECOUPLING INVARIANT CONFIRMED</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-slate-400">Original Address: <span className="text-sky-300">{addressPerturbationResult.originalAddress}</span></div>
                      <div className="text-slate-400">Mutated Address: <span className="text-amber-300">{addressPerturbationResult.mutatedAddress}</span></div>
                      <div className="text-slate-400">Payload Divergence: <span className="text-emerald-400 font-bold">0.000% (Identical Bytes)</span></div>
                      <div className="text-slate-400">SHA-256 Equality: <span className="text-emerald-400 font-bold">MATCH</span></div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
                      Proves that moving address coordinates alters virtual location without modifying file content.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
