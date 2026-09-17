/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R7: Observable Reality 3D Viewport
 *
 * Fully interactive 3D WebGL / Three.js viewport rendering R7SceneGraph entities.
 * Preserves canonical coordinates [5, 3, 6], selection, camera isolation, and telemetry.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import {
  R7SceneGraph,
  R7VisualObject,
  R7CameraState,
  R7LayerToggles,
  R7LiveSyncStatus,
  R7ViewPreset,
} from '../types';
import { RealityLiveBindingEngine } from '../liveBinding';
import { R7RealityInspector } from './R7RealityInspector';
import { R7RealityTelemetry } from './R7RealityTelemetry';

interface R7RealityViewportProps {
  bindingEngine: RealityLiveBindingEngine;
  onExit?: () => void;
}

export const R7RealityViewport: React.FC<R7RealityViewportProps> = ({
  bindingEngine,
  onExit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const [, setTick] = useState(0);
  const triggerRender = useCallback(() => setTick((t) => t + 1), []);

  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [telemetryOpen, setTelemetryOpen] = useState(true);

  const sceneGraph = bindingEngine.getSceneGraph();
  const cameraState = bindingEngine.getCamera();
  const layerToggles = bindingEngine.getLayerToggles();
  const selectionState = bindingEngine.getSelection();
  const selectedObject = bindingEngine.getSelectedVisualObject();
  const syncStatus = bindingEngine.getSyncStatus();
  const workspaceState = bindingEngine.getWorkspaceState();
  const causalityEvents = bindingEngine.getCausalityEvents();

  // ─── Three.js Scene Setup & Render Loop ───
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0A0A0B');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(cameraState.position[0], cameraState.position[1], cameraState.position[2]);
    camera.lookAt(cameraState.target[0], cameraState.target[1], cameraState.target[2]);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 30);
    scene.add(dirLight);

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // ─── Scene Graph Rebuild when sceneGraph / layerToggles / camera changes ───
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

    // Clear existing dynamic scene objects
    while (scene.children.length > 2) {
      scene.remove(scene.children[scene.children.length - 1]);
    }

    // Grid & Axes
    if (layerToggles.showGrid) {
      const grid = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
      grid.rotation.x = Math.PI / 2;
      scene.add(grid);
    }
    if (layerToggles.showAxes) {
      const axes = new THREE.AxesHelper(10);
      scene.add(axes);
    }

    // Meshes Map for raycasting & relationship lines
    const meshMap = new Map<string, THREE.Vector3>();

    // Reality Objects
    if (layerToggles.showRealityObjects) {
      sceneGraph.nodes.forEach((node) => {
        const vo = node.visualObject;
        const [x, y, z] = vo.transform.coordinates;
        const isSelected = vo.identity.visualObjectId === selectionState.selectedVisualObjectId;
        const dims = vo.transform.dimensions || [1.5, 1.5, 1.5];

        meshMap.set(vo.identity.visualObjectId, new THREE.Vector3(x, y, z));

        // Geometry & Material
        const geom = new THREE.BoxGeometry(dims[0], dims[1], dims[2]);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(vo.style.color),
          transparent: true,
          opacity: isSelected ? 1.0 : vo.style.opacity,
          wireframe: vo.style.wireframe,
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, y, z);
        mesh.userData = { visualObjectId: vo.identity.visualObjectId };
        scene.add(mesh);

        // Selection Highlight Wireframe
        if (isSelected) {
          const wireGeom = new THREE.BoxGeometry(dims[0] * 1.15, dims[1] * 1.15, dims[2] * 1.15);
          const wireMat = new THREE.MeshBasicMaterial({
            color: 0x39ff14,
            wireframe: true,
          });
          const wireMesh = new THREE.Mesh(wireGeom, wireMat);
          wireMesh.position.set(x, y, z);
          scene.add(wireMesh);
        }

        // Labels
        if (layerToggles.showLabels) {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.strokeStyle = isSelected ? '#39FF14' : vo.style.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(4, 4, 248, 56);
            ctx.fillRect(4, 4, 248, 56);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${vo.name} [${x},${y},${z}]`, 128, 28);

            ctx.fillStyle = '#94A3B8';
            ctx.font = '12px monospace';
            ctx.fillText(`${vo.certainty} | ${vo.origin}`, 128, 48);
          }

          const texture = new THREE.CanvasTexture(canvas);
          const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
          const sprite = new THREE.Sprite(spriteMat);
          sprite.position.set(x, y + (dims[1] / 2 + 1.2), z);
          sprite.scale.set(3.5, 0.85, 1);
          scene.add(sprite);
        }
      });
    }

    // Relationships Connectors
    if (layerToggles.showRelationships) {
      sceneGraph.relationships.forEach((rel) => {
        const srcPos = meshMap.get(rel.sourceVisualObjectId);
        const tgtPos = meshMap.get(rel.targetVisualObjectId);
        if (srcPos && tgtPos) {
          const lineGeom = new THREE.BufferGeometry().setFromPoints([srcPos, tgtPos]);
          const lineMat = new THREE.LineBasicMaterial({
            color: new THREE.Color(rel.color),
            linewidth: 2,
          });
          const line = new THREE.Line(lineGeom, lineMat);
          scene.add(line);
        }
      });
    }

    // Spatial & Topology Connectors
    if (layerToggles.showSpatial || layerToggles.showTopology) {
      sceneGraph.spatialRelations.forEach((sp) => {
        const srcPos = meshMap.get(sp.sourceVisualObjectId);
        const tgtPos = meshMap.get(sp.targetVisualObjectId);
        if (srcPos && tgtPos) {
          const lineGeom = new THREE.BufferGeometry().setFromPoints([srcPos, tgtPos]);
          const lineMat = new THREE.LineDashedMaterial({
            color: 0xffa500,
            dashSize: 0.5,
            gapSize: 0.3,
          });
          const line = new THREE.Line(lineGeom, lineMat);
          line.computeLineDistances();
          scene.add(line);
        }
      });
    }

    // Update Camera position
    camera.position.set(cameraState.position[0], cameraState.position[1], cameraState.position[2]);
    camera.lookAt(cameraState.target[0], cameraState.target[1], cameraState.target[2]);
    camera.zoom = cameraState.zoom;
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
  }, [sceneGraph, cameraState, layerToggles, selectionState]);

  // ─── Click Raycasting for Object Selection ───
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !sceneRef.current || !cameraRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    const hit = intersects.find((i) => i.object.userData?.visualObjectId);
    if (hit) {
      const vobjId = hit.object.userData.visualObjectId as string;
      bindingEngine.selectObject(vobjId);
      triggerRender();
    } else {
      bindingEngine.selectObject(null);
      triggerRender();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#0A0A0B',
        color: '#E0E0E0',
        fontFamily: 'monospace',
        overflow: 'hidden',
      }}
    >
      {/* Top Application Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          backgroundColor: '#0F172A',
          borderBottom: '1px solid #1E293B',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#00E5FF' }}>
            R7 — Observable Reality 3D Workspace Visualization
          </span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#1E293B',
              color: syncStatus === 'SYNCED' ? '#00FF88' : '#FFA500',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            {syncStatus}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setInspectorOpen(!inspectorOpen)}
            style={btnSmall(inspectorOpen)}
          >
            Inspector
          </button>
          <button
            onClick={() => setTelemetryOpen(!telemetryOpen)}
            style={btnSmall(telemetryOpen)}
          >
            Telemetry
          </button>
          {onExit && (
            <button onClick={onExit} style={btnExit}>
              Exit R7
            </button>
          )}
        </div>
      </div>

      {/* Viewport Control Bar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '8px 20px',
          backgroundColor: '#090D16',
          borderBottom: '1px solid #1E293B',
          alignItems: 'center',
          flexWrap: 'wrap',
          fontSize: '12px',
        }}
      >
        <span style={{ color: '#94A3B8', marginRight: '4px' }}>Camera:</span>
        {(['PERSPECTIVE', 'TOP', 'FRONT', 'SIDE', 'ISOMETRIC'] as R7ViewPreset[]).map((preset) => (
          <button
            key={preset}
            onClick={() => {
              bindingEngine.setCameraPreset(preset);
              triggerRender();
            }}
            style={btnCamera(cameraState.viewPreset === preset)}
          >
            {preset}
          </button>
        ))}

        <div style={{ width: '1px', height: '18px', backgroundColor: '#334155', margin: '0 6px' }} />

        <button
          onClick={() => {
            bindingEngine.adjustCameraZoom(0.2);
            triggerRender();
          }}
          style={btnCtrl}
        >
          Zoom In (+)
        </button>
        <button
          onClick={() => {
            bindingEngine.adjustCameraZoom(-0.2);
            triggerRender();
          }}
          style={btnCtrl}
        >
          Zoom Out (-)
        </button>
        <button
          onClick={() => {
            bindingEngine.adjustCameraOrbit(15);
            triggerRender();
          }}
          style={btnCtrl}
        >
          Orbit (+15°)
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: '#334155', margin: '0 6px' }} />

        <span style={{ color: '#94A3B8', marginRight: '4px' }}>Layers:</span>
        <button
          onClick={() => {
            bindingEngine.toggleLayer('showRealityObjects');
            triggerRender();
          }}
          style={btnToggle(layerToggles.showRealityObjects)}
        >
          Objects
        </button>
        <button
          onClick={() => {
            bindingEngine.toggleLayer('showRelationships');
            triggerRender();
          }}
          style={btnToggle(layerToggles.showRelationships)}
        >
          Relationships
        </button>
        <button
          onClick={() => {
            bindingEngine.toggleLayer('showSpatial');
            triggerRender();
          }}
          style={btnToggle(layerToggles.showSpatial)}
        >
          Spatial
        </button>
        <button
          onClick={() => {
            bindingEngine.toggleLayer('showLabels');
            triggerRender();
          }}
          style={btnToggle(layerToggles.showLabels)}
        >
          Labels
        </button>
        <button
          onClick={() => {
            bindingEngine.toggleLayer('showGrid');
            triggerRender();
          }}
          style={btnToggle(layerToggles.showGrid)}
        >
          Grid
        </button>
      </div>

      {/* Main Viewport & Floating Side Panels */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* 3D WebGL Canvas */}
        <div
          ref={containerRef}
          onClick={handleCanvasClick}
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            cursor: 'crosshair',
          }}
        />

        {/* Right Floating Inspection & Telemetry Panel */}
        {(inspectorOpen || telemetryOpen) && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '380px',
              maxHeight: 'calc(100% - 24px)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              pointerEvents: 'auto',
            }}
          >
            {inspectorOpen && (
              <R7RealityInspector
                selectedObject={selectedObject}
                syncStatus={syncStatus}
                onClose={() => setInspectorOpen(false)}
              />
            )}
            {telemetryOpen && (
              <R7RealityTelemetry
                sceneGraph={sceneGraph}
                syncStatus={syncStatus}
                realityChecksum={workspaceState.realityBinding.realityStateChecksum}
                workspaceChecksum={workspaceState.workspaceChecksum}
                causalityEvents={causalityEvents}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const btnSmall = (active: boolean): React.CSSProperties => ({
  padding: '4px 10px',
  backgroundColor: active ? '#0284C7' : '#1E293B',
  border: '1px solid #334155',
  color: active ? '#FFFFFF' : '#94A3B8',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
});

const btnExit: React.CSSProperties = {
  padding: '4px 12px',
  backgroundColor: '#334155',
  border: '1px solid #475569',
  color: '#E2E8F0',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
};

const btnCamera = (active: boolean): React.CSSProperties => ({
  padding: '3px 8px',
  backgroundColor: active ? '#0369A1' : '#1E293B',
  border: active ? '1px solid #38BDF8' : '1px solid #334155',
  color: active ? '#FFFFFF' : '#94A3B8',
  borderRadius: '3px',
  cursor: 'pointer',
  fontSize: '11px',
});

const btnCtrl: React.CSSProperties = {
  padding: '3px 8px',
  backgroundColor: '#1E293B',
  border: '1px solid #334155',
  color: '#E2E8F0',
  borderRadius: '3px',
  cursor: 'pointer',
  fontSize: '11px',
};

const btnToggle = (active: boolean): React.CSSProperties => ({
  padding: '3px 8px',
  backgroundColor: active ? '#065F46' : '#1E293B',
  border: active ? '1px solid #34D399' : '1px solid #334155',
  color: active ? '#6EE7B7' : '#64748B',
  borderRadius: '3px',
  cursor: 'pointer',
  fontSize: '11px',
});
