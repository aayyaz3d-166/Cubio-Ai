/**
 * CUBiO AI — Experimental Euler Memory Panel & 3D Interactive Viewport
 * 
 * 7 × 7 × 7 Phase Rotation & Projection Explorer (343 Nodes)
 * Isolated Mathematical Visualization Layer
 * 
 * Status: CUBiO Euler Memory — EXPERIMENTAL
 * Classification: EXP-007 PREPARATION / ENGINEERING PROTOTYPE
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Sliders,
  Eye,
  CheckCircle2,
  Info,
  Maximize2,
  Sparkles,
  Layers,
  Compass,
  Zap,
  Activity,
  Box
} from 'lucide-react';
import { EulerMemoryEngine, EulerProjectedNode, EulerValidationResult } from '../core/EulerMemoryEngine';
import { MemoryGrid3D } from '../types/memory';

interface EulerMemoryPanelProps {
  memoryGrid?: MemoryGrid3D | null;
  onClose?: () => void;
}

export const EulerMemoryPanel: React.FC<EulerMemoryPanelProps> = ({ memoryGrid }) => {
  // 1. Engine Instance
  const engine = useMemo(() => new EulerMemoryEngine(7), []);

  // 2. Interactive State
  const [phaseRotation, setPhaseRotation] = useState<number>(0);
  const [projectionMode, setProjectionMode] = useState<'ORIGINAL' | 'PROJECTED' | 'COMPARE'>('COMPARE');
  const [displayReal, setDisplayReal] = useState<boolean>(true);
  const [displayImag, setDisplayImag] = useState<boolean>(true);
  const [displayPhase, setDisplayPhase] = useState<boolean>(true);
  const [displayWeight, setDisplayWeight] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<EulerProjectedNode | null>(null);
  const [validation, setValidation] = useState<EulerValidationResult>(engine.validateEulerState());

  // Adapt non-mutating weights from memory grid if provided
  useEffect(() => {
    if (memoryGrid) {
      engine.adaptFromMemoryGrid(memoryGrid);
      setValidation(engine.validateEulerState());
    }
  }, [memoryGrid, engine]);

  // Handle phase updates
  const handlePhaseChange = useCallback((newPhi: number) => {
    engine.setAbsolutePhase(newPhi);
    setPhaseRotation(newPhi);
    setValidation(engine.validateEulerState());
  }, [engine]);

  const handleStepDelta = useCallback((delta: number) => {
    const nextPhi = phaseRotation + delta;
    handlePhaseChange(nextPhi);
  }, [phaseRotation, handlePhaseChange]);

  const handleReset = useCallback(() => {
    engine.resetPhase();
    setPhaseRotation(0);
    setValidation(engine.validateEulerState());
  }, [engine]);

  // Projected Nodes
  const projectedNodes = useMemo(() => {
    return engine.projectTo3D();
  }, [engine, phaseRotation]);

  // 3. Three.js Canvas Ref
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0c10);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(14, 12, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    // Grid Helpers & Bounding Box
    const gridHelper = new THREE.GridHelper(14, 14, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -4;
    scene.add(gridHelper);

    const pointsGroup = new THREE.Group();
    pointsGroupRef.current = pointsGroup;
    scene.add(pointsGroup);

    // Orbit Controls manual drag
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      pointsGroup.rotation.y += deltaX * 0.005;
      pointsGroup.rotation.x += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, []);

  // Update 3D Geometry when nodes or projectionMode change
  useEffect(() => {
    if (!pointsGroupRef.current) return;
    const group = pointsGroupRef.current;
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    const sphereGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const originOffset = 3.0; // center the 7x7x7 cube around (0,0,0)

    for (const node of projectedNodes) {
      const origPos = new THREE.Vector3(
        node.originalCoords.x - originOffset,
        node.originalCoords.y - originOffset,
        node.originalCoords.z - originOffset
      );

      const projPos = new THREE.Vector3(
        node.x - originOffset * node.real,
        node.y - originOffset * node.real,
        node.z - originOffset * node.real
      );

      // Determine Color from Phase Angle φ
      const hue = ((node.phase % (2 * Math.PI)) / (2 * Math.PI) + 1) % 1;
      const color = new THREE.Color().setHSL(hue, 0.85, 0.55);

      if (projectionMode === 'ORIGINAL' || projectionMode === 'COMPARE') {
        const mat = new THREE.MeshStandardMaterial({
          color: projectionMode === 'COMPARE' ? 0x64748b : color,
          roughness: 0.3,
          metalness: 0.2,
          transparent: projectionMode === 'COMPARE',
          opacity: projectionMode === 'COMPARE' ? 0.35 : 0.95
        });
        const mesh = new THREE.Mesh(sphereGeo, mat);
        mesh.position.copy(origPos);
        group.add(mesh);
      }

      if (projectionMode === 'PROJECTED' || projectionMode === 'COMPARE') {
        const mat = new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.25,
          roughness: 0.2,
          metalness: 0.5
        });
        const mesh = new THREE.Mesh(sphereGeo, mat);
        mesh.position.copy(projPos);
        group.add(mesh);

        // In COMPARE mode, draw connecting displacement lines
        if (projectionMode === 'COMPARE') {
          const lineGeo = new THREE.BufferGeometry().setFromPoints([origPos, projPos]);
          const lineMat = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3
          });
          const line = new THREE.Line(lineGeo, lineMat);
          group.add(line);
        }
      }
    }
  }, [projectedNodes, projectionMode]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0c10] text-slate-100 overflow-hidden font-sans">
      {/* Top Banner & Metadata */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-[#0d1117]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white">
                Euler Memory Engine
              </h2>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                EXPERIMENTAL
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                EXP-007 PREPARATION / ENGINEERING PROTOTYPE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              7 × 7 × 7 Spatial Phase Rotation & 3D Projection (343 Nodes)
            </p>
          </div>
        </div>

        {/* Invariant Health Badges */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Nodes:</span>
            <span className="font-mono text-emerald-400">{validation.nodeCount} / 343</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">cos²φ + sin²φ:</span>
            <span className="font-mono text-cyan-400">
              {validation.isValid ? '1.0 (Exact)' : 'FAIL'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Control Sidebar */}
        <div className="w-80 border-r border-slate-800 bg-[#0d1117] p-5 flex flex-col gap-5 overflow-y-auto">
          {/* Grid Size Display */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Grid Configuration
            </label>
            <div className="mt-1.5 p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <span className="text-sm font-medium">Grid Size</span>
              <span className="font-mono text-sm font-bold text-indigo-400">7 × 7 × 7 (343 Nodes)</span>
            </div>
          </div>

          {/* Phase Rotation Slider */}
          <div>
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Phase Rotation (φ)
              </label>
              <span className="font-mono text-xs text-indigo-400 font-bold">
                {(phaseRotation % (2 * Math.PI)).toFixed(3)} rad / {(((phaseRotation % (2 * Math.PI)) / Math.PI) * 180).toFixed(1)}°
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={2 * Math.PI}
              step="0.01"
              value={phaseRotation % (2 * Math.PI)}
              onChange={(e) => handlePhaseChange(parseFloat(e.target.value))}
              className="w-full mt-2 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />

            {/* Stepper Buttons */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                onClick={() => handleStepDelta(-Math.PI / 16)}
                className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition"
              >
                [ - π/16 ]
              </button>
              <button
                onClick={handleReset}
                className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
              >
                [ Reset ]
              </button>
              <button
                onClick={() => handleStepDelta(Math.PI / 16)}
                className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition"
              >
                [ + π/16 ]
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Phase Presets
            </label>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {[
                { label: 'π/4', val: Math.PI / 4 },
                { label: 'π/2', val: Math.PI / 2 },
                { label: 'π', val: Math.PI },
                { label: '2π', val: 2 * Math.PI }
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePhaseChange(preset.val)}
                  className="py-1.5 text-xs font-mono rounded bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white transition"
                >
                  [ {preset.label} ]
                </button>
              ))}
            </div>
          </div>

          {/* Projection Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Projection Viewport
            </label>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5">
              {(['ORIGINAL', 'PROJECTED', 'COMPARE'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setProjectionMode(mode)}
                  className={`py-1.5 text-xs font-medium rounded transition ${
                    projectionMode === mode
                      ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode === 'ORIGINAL' ? 'Original' : mode === 'PROJECTED' ? 'Projected' : 'Compare'}
                </button>
              ))}
            </div>
          </div>

          {/* Display Components Toggles */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Display Channels
            </label>
            <div className="mt-1.5 space-y-1.5">
              <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
                <span className="text-xs text-slate-300">Real Component (cos φ)</span>
                <input
                  type="checkbox"
                  checked={displayReal}
                  onChange={(e) => setDisplayReal(e.target.checked)}
                  className="accent-indigo-500"
                />
              </label>
              <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
                <span className="text-xs text-slate-300">Imaginary Component (sin φ)</span>
                <input
                  type="checkbox"
                  checked={displayImag}
                  onChange={(e) => setDisplayImag(e.target.checked)}
                  className="accent-indigo-500"
                />
              </label>
              <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
                <span className="text-xs text-slate-300">Phase Angle (φ)</span>
                <input
                  type="checkbox"
                  checked={displayPhase}
                  onChange={(e) => setDisplayPhase(e.target.checked)}
                  className="accent-indigo-500"
                />
              </label>
              <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer">
                <span className="text-xs text-slate-300">Node Weight</span>
                <input
                  type="checkbox"
                  checked={displayWeight}
                  onChange={(e) => setDisplayWeight(e.target.checked)}
                  className="accent-indigo-500"
                />
              </label>
            </div>
          </div>

          {/* Mathematical Proof Card */}
          <div className="mt-auto p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] space-y-1.5 text-slate-400">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              Mathematical Invariants
            </div>
            <div>• Equation: <span className="font-mono text-slate-200">e^(iφ) = cos(φ) + i sin(φ)</span></div>
            <div>• Unit Circle: <span className="font-mono text-slate-200">cos²(φ) + sin²(φ) = 1.0</span></div>
            <div>• Projection: <span className="font-mono text-slate-200">X' = X × cos(φ)</span></div>
            <div>• Max Invariant Drift: <span className="font-mono text-emerald-400">&lt; 1e-15</span></div>
          </div>
        </div>

        {/* Right 3D Viewport */}
        <div className="flex-1 relative flex flex-col">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Viewport Overlay Controls & Instructions */}
          <div className="absolute top-4 left-4 pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-3 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-white">3D Spatial Viewport</div>
              <div className="text-slate-400">Drag to rotate • 343 Spatial Nodes</div>
              <div className="text-[11px] text-indigo-400 font-mono">
                Hue: Phase φ | Lines: Displacement Vector (X → X')
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
