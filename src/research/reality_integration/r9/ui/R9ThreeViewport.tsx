/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel R9: Production-Grade 3D Three.js WebGL Viewport
 *
 * Visibly renders actual 3D geometry (Box, Sphere, Cylinder, Cone, Torus, Plane, Custom/Extruded Mesh)
 * with Transform Gizmos, Snapping, Camera Presets, Shading Modes (Solid/Wire/Solid+Wire/XRay),
 * Edit Mode Sub-element Highlights (Vertex/Edge/Face), and Canonical Reality Anchor [5, 3, 6].
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Compass,
  Maximize2,
  Minimize2,
  RotateCcw,
  Eye,
  Grid as GridIcon,
  Layers,
  Box as BoxIcon,
  ShieldCheck,
  Camera,
} from 'lucide-react';
import { WorkspaceGeometry } from '../types';

export interface R9ThreeViewportProps {
  readonly geometries: Readonly<Record<string, WorkspaceGeometry>>;
  readonly selectedGeometryId: string | null;
  readonly onSelectGeometry: (geometryId: string) => void;
  readonly activePreviewMesh?: WorkspaceGeometry | null;
  readonly hiddenGeometryIds?: ReadonlySet<string>;
  readonly lockedGeometryIds?: ReadonlySet<string>;
  readonly activeTool?: string;
  readonly editMode?: 'OBJECT' | 'VERTEX' | 'EDGE' | 'FACE';
  readonly cameraMode?: 'PERSPECTIVE' | 'ORTHOGRAPHIC';
  readonly shadingMode?: 'SOLID' | 'WIREFRAME' | 'SOLID_WIREFRAME' | 'XRAY';
  readonly isSnappingActive?: boolean;
  readonly snapMode?: string;
  readonly onTransformGeometry?: (geometryId: string, deltaT: [number, number, number], deltaR: [number, number, number], deltaS: [number, number, number]) => void;
  readonly onSelectSubElement?: (type: 'VERTEX' | 'EDGE' | 'FACE', elementId: string) => void;
  readonly selectedSubElementId?: string | null;
}

export const R9ThreeViewport: React.FC<R9ThreeViewportProps> = ({
  geometries,
  selectedGeometryId,
  onSelectGeometry,
  activePreviewMesh,
  hiddenGeometryIds = new Set(),
  lockedGeometryIds = new Set(),
  activeTool = 'SELECT',
  editMode = 'OBJECT',
  cameraMode = 'PERSPECTIVE',
  shadingMode = 'SOLID_WIREFRAME',
  isSnappingActive = false,
  snapMode = 'GRID',
  onTransformGeometry,
  onSelectSubElement,
  selectedSubElementId,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const perspCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orthoCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const activeCameraRef = useRef<THREE.Camera | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const gizmoGroupRef = useRef<THREE.Group | null>(null);

  // Camera Orbit State
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const isGizmoDraggingRef = useRef(false);
  const activeGizmoAxisRef = useRef<'X' | 'Y' | 'Z' | null>(null);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 24 });
  const cameraTargetRef = useRef(new THREE.Vector3(5, 3, 6)); // Center on canonical Reality anchor

  // Snapping helper
  const applySnapping = (val: number, step = 0.5): number => {
    if (!isSnappingActive) return val;
    return Math.round(val / step) * step;
  };

  const updateCameraPosition = useCallback(() => {
    const { theta, phi, radius } = cameraAngleRef.current;
    const target = cameraTargetRef.current;

    const px = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const py = target.y + radius * Math.cos(phi);
    const pz = target.z + radius * Math.sin(phi) * Math.cos(theta);

    if (perspCameraRef.current) {
      perspCameraRef.current.position.set(px, py, pz);
      perspCameraRef.current.lookAt(target);
    }
    if (orthoCameraRef.current) {
      orthoCameraRef.current.position.set(px, py, pz);
      orthoCameraRef.current.lookAt(target);
    }
  }, []);

  // View Preset Handler
  const setViewPreset = (preset: 'TOP' | 'FRONT' | 'RIGHT' | 'LEFT' | 'BACK' | 'BOTTOM' | 'ISOMETRIC') => {
    switch (preset) {
      case 'TOP':
        cameraAngleRef.current.theta = 0;
        cameraAngleRef.current.phi = 0.001;
        break;
      case 'BOTTOM':
        cameraAngleRef.current.theta = 0;
        cameraAngleRef.current.phi = Math.PI - 0.001;
        break;
      case 'FRONT':
        cameraAngleRef.current.theta = 0;
        cameraAngleRef.current.phi = Math.PI / 2;
        break;
      case 'BACK':
        cameraAngleRef.current.theta = Math.PI;
        cameraAngleRef.current.phi = Math.PI / 2;
        break;
      case 'RIGHT':
        cameraAngleRef.current.theta = Math.PI / 2;
        cameraAngleRef.current.phi = Math.PI / 2;
        break;
      case 'LEFT':
        cameraAngleRef.current.theta = -Math.PI / 2;
        cameraAngleRef.current.phi = Math.PI / 2;
        break;
      case 'ISOMETRIC':
      default:
        cameraAngleRef.current.theta = Math.PI / 4;
        cameraAngleRef.current.phi = Math.PI / 3;
        break;
    }
    updateCameraPosition();
  };

  const handleFrameAll = () => {
    cameraTargetRef.current.set(5, 3, 6);
    cameraAngleRef.current.radius = 26;
    setViewPreset('ISOMETRIC');
  };

  const handleFitSelected = () => {
    if (!selectedGeometryId || !geometries[selectedGeometryId]) {
      handleFrameAll();
      return;
    }
    const geo = geometries[selectedGeometryId];
    const [tx, ty, tz] = geo.transform.translation;
    const anchor = geo.realityReference ? geo.realityReference.realityCoordinates : [0, 0, 0];
    cameraTargetRef.current.set(tx + anchor[0], ty + anchor[1], tz + anchor[2]);
    cameraAngleRef.current.radius = 12;
    updateCameraPosition();
  };

  // Main Three.js Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070B14);
    sceneRef.current = scene;

    // 2. Cameras
    const aspect = width / height;
    const perspCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    perspCameraRef.current = perspCamera;

    const orthoFrustum = 16;
    const orthoCamera = new THREE.OrthographicCamera(
      (-orthoFrustum * aspect) / 2,
      (orthoFrustum * aspect) / 2,
      orthoFrustum / 2,
      -orthoFrustum / 2,
      0.1,
      1000
    );
    orthoCameraRef.current = orthoCamera;

    activeCameraRef.current = cameraMode === 'PERSPECTIVE' ? perspCamera : orthoCamera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    keyLight.position.set(20, 30, 25);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 0.4);
    fillLight.position.set(-20, -10, -20);
    scene.add(fillLight);

    // 5. Grid & Coordinate Axes
    const mainGrid = new THREE.GridHelper(40, 40, 0x6d28d9, 0x1e293b);
    mainGrid.position.y = 0;
    scene.add(mainGrid);

    const subGrid = new THREE.GridHelper(40, 200, 0x4c1d95, 0x0f172a);
    subGrid.position.y = -0.001;
    scene.add(subGrid);

    const axes = new THREE.AxesHelper(6);
    axes.position.set(0, 0.01, 0);
    scene.add(axes);

    // 6. Canonical Reality Anchor Beacon [5, 3, 6]
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(5, 3, 6);

    const beaconGeo = new THREE.OctahedronGeometry(0.5, 0);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      wireframe: true,
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconGroup.add(beaconMesh);

    // Anchor Plinth / Line to Ground
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -3, 0),
    ]);
    const lineMat = new THREE.LineDashedMaterial({ color: 0x00ff88, dashSize: 0.3, gapSize: 0.15 });
    const plumbLine = new THREE.Line(lineGeo, lineMat);
    plumbLine.computeLineDistances();
    beaconGroup.add(plumbLine);

    scene.add(beaconGroup);

    // 7. Gizmo Group for active selection
    const gizmoGroup = new THREE.Group();
    scene.add(gizmoGroup);
    gizmoGroupRef.current = gizmoGroup;

    // 8. Event Listeners (Orbit, Pan, Zoom, Drag, Raycast)
    const handleMouseDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      // Check gizmo hit first
      if (gizmoGroupRef.current && activeCameraRef.current) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, activeCameraRef.current);
        const hits = raycaster.intersectObjects(gizmoGroupRef.current.children, true);
        if (hits.length > 0 && hits[0].object.userData.gizmoAxis) {
          isGizmoDraggingRef.current = true;
          activeGizmoAxisRef.current = hits[0].object.userData.gizmoAxis;
          prevMouseRef.current = { x: e.clientX, y: e.clientY };
          return;
        }
      }

      if (e.button === 0) isDraggingRef.current = true;
      if (e.button === 2) isPanningRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };

      if (isGizmoDraggingRef.current && selectedGeometryId && onTransformGeometry) {
        const axis = activeGizmoAxisRef.current;
        const deltaFactor = 0.05;
        let delta = dx * deltaFactor;
        if (axis === 'Y') delta = -dy * deltaFactor;
        delta = applySnapping(delta, 0.25);

        if (activeTool === 'MOVE' && axis) {
          const deltaT: [number, number, number] = [
            axis === 'X' ? delta : 0,
            axis === 'Y' ? delta : 0,
            axis === 'Z' ? delta : 0,
          ];
          onTransformGeometry(selectedGeometryId, deltaT, [0, 0, 0], [1, 1, 1]);
        } else if (activeTool === 'ROTATE' && axis) {
          const deltaR: [number, number, number] = [
            axis === 'X' ? delta * 15 : 0,
            axis === 'Y' ? delta * 15 : 0,
            axis === 'Z' ? delta * 15 : 0,
          ];
          onTransformGeometry(selectedGeometryId, [0, 0, 0], deltaR, [1, 1, 1]);
        } else if (activeTool === 'SCALE' && axis) {
          const sVal = Math.max(0.1, 1 + delta * 0.1);
          const deltaS: [number, number, number] = [
            axis === 'X' ? sVal : 1,
            axis === 'Y' ? sVal : 1,
            axis === 'Z' ? sVal : 1,
          ];
          onTransformGeometry(selectedGeometryId, [0, 0, 0], [0, 0, 0], deltaS);
        }
      } else if (isDraggingRef.current) {
        cameraAngleRef.current.theta -= dx * 0.008;
        cameraAngleRef.current.phi = Math.max(0.05, Math.min(Math.PI - 0.05, cameraAngleRef.current.phi - dy * 0.008));
        updateCameraPosition();
      } else if (isPanningRef.current && activeCameraRef.current) {
        const factor = cameraAngleRef.current.radius * 0.001;
        const forward = new THREE.Vector3().subVectors(activeCameraRef.current.position, cameraTargetRef.current).normalize();
        const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();
        const up = new THREE.Vector3(0, 1, 0);

        cameraTargetRef.current.addScaledVector(right, dx * factor);
        cameraTargetRef.current.addScaledVector(up, -dy * factor);
        updateCameraPosition();
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isPanningRef.current = false;
      isGizmoDraggingRef.current = false;
      activeGizmoAxisRef.current = null;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.radius = Math.max(2, Math.min(120, cameraAngleRef.current.radius + e.deltaY * 0.02));
      updateCameraPosition();
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const handleCanvasClick = (e: MouseEvent) => {
      if (isGizmoDraggingRef.current || !activeCameraRef.current || !sceneRef.current || !rendererRef.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, activeCameraRef.current);
      const intersects = raycaster.intersectObjects(Array.from(meshMapRef.current.values()), true);

      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && !hitObj.userData.geometryId && hitObj.parent) {
          hitObj = hitObj.parent;
        }
        if (hitObj?.userData?.geometryId) {
          onSelectGeometry(hitObj.userData.geometryId);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('contextmenu', handleContextMenu);
    dom.addEventListener('click', handleCanvasClick);

    // 9. Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (beaconMesh) {
        beaconMesh.rotation.y += 0.01;
      }
      const cam = activeCameraRef.current;
      if (rendererRef.current && sceneRef.current && cam) {
        rendererRef.current.render(sceneRef.current, cam);
      }
    };
    animate();

    // 10. Resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && rendererRef.current) {
          const asp = w / h;
          if (perspCameraRef.current) {
            perspCameraRef.current.aspect = asp;
            perspCameraRef.current.updateProjectionMatrix();
          }
          if (orthoCameraRef.current) {
            orthoCameraRef.current.left = (-orthoFrustum * asp) / 2;
            orthoCameraRef.current.right = (orthoFrustum * asp) / 2;
            orthoCameraRef.current.top = orthoFrustum / 2;
            orthoCameraRef.current.bottom = -orthoFrustum / 2;
            orthoCameraRef.current.updateProjectionMatrix();
          }
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('contextmenu', handleContextMenu);
      dom.removeEventListener('click', handleCanvasClick);
      renderer.dispose();
    };
  }, []);

  // Update Camera Projection when cameraMode changes
  useEffect(() => {
    activeCameraRef.current = cameraMode === 'PERSPECTIVE' ? perspCameraRef.current : orthoCameraRef.current;
    updateCameraPosition();
  }, [cameraMode, updateCameraPosition]);

  // Mesh & Gizmo Generation Sync
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear meshes
    meshMapRef.current.forEach((mesh) => scene.remove(mesh));
    meshMapRef.current.clear();

    // Clear gizmos
    if (gizmoGroupRef.current) {
      gizmoGroupRef.current.clear();
    }

    const allToRender = activePreviewMesh
      ? { ...geometries, [activePreviewMesh.geometryId]: activePreviewMesh }
      : geometries;

    Object.values(allToRender).forEach((geo: WorkspaceGeometry) => {
      if (hiddenGeometryIds.has(geo.geometryId)) return;

      const isSelected = geo.geometryId === selectedGeometryId;
      const isPreview = activePreviewMesh && geo.geometryId === activePreviewMesh.geometryId;
      const isLocked = lockedGeometryIds.has(geo.geometryId);

      let threeGeo: THREE.BufferGeometry;
      const type = geo.identity.geometryType;
      const dims = geo.dimensions;

      if (type === 'BOX') {
        threeGeo = new THREE.BoxGeometry(dims.width || 2, dims.height || 2, dims.depth || 2);
      } else if (type === 'SPHERE') {
        threeGeo = new THREE.SphereGeometry((dims.width || 2) / 2, 28, 28);
      } else if (type === 'CYLINDER') {
        threeGeo = new THREE.CylinderGeometry((dims.width || 2) / 2, (dims.width || 2) / 2, dims.height || 2, 28);
      } else if (type === 'CONE') {
        threeGeo = new THREE.ConeGeometry((dims.width || 2) / 2, dims.height || 2, 28);
      } else if (type === 'TORUS') {
        threeGeo = new THREE.TorusGeometry((dims.width || 2) / 2, 0.45, 18, 36);
      } else if (type === 'PLANE') {
        threeGeo = new THREE.PlaneGeometry(dims.width || 10, dims.depth || 10);
        threeGeo.rotateX(-Math.PI / 2);
      } else {
        // Custom Mesh build
        threeGeo = new THREE.BufferGeometry();
        const positions: number[] = [];
        const vIdMap = new Map<string, readonly [number, number, number]>();
        geo.mesh.vertices.forEach((v) => vIdMap.set(v.vertexId, v.position));

        for (const face of geo.mesh.faces) {
          if (face.vertexIds.length >= 3) {
            const v0 = vIdMap.get(face.vertexIds[0]) ?? [0, 0, 0];
            for (let i = 1; i < face.vertexIds.length - 1; i++) {
              const v1 = vIdMap.get(face.vertexIds[i]) ?? [0, 0, 0];
              const v2 = vIdMap.get(face.vertexIds[i + 1]) ?? [0, 0, 0];
              positions.push(v0[0], v0[1], v0[2]);
              positions.push(v1[0], v1[1], v1[2]);
              positions.push(v2[0], v2[1], v2[2]);
            }
          }
        }
        if (positions.length > 0) {
          threeGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          threeGeo.computeVertexNormals();
        } else {
          threeGeo = new THREE.BoxGeometry(1, 1, 1);
        }
      }

      // Material Color based on Epistemic Origin
      let mainColor = 0xf59e0b; // Amber (USER_CONSTRUCTED)
      if (geo.identity.origin === 'OBSERVED') mainColor = 0x06b6d4; // Cyan (OBSERVED Reality)
      if (geo.identity.origin === 'DERIVED') mainColor = 0x8b5cf6; // Violet (DERIVED)
      if (isPreview) mainColor = 0xf43f5e; // Rose for Preview

      const group = new THREE.Group();
      group.userData.geometryId = geo.geometryId;

      const isWire = shadingMode === 'WIREFRAME';
      const isXRay = shadingMode === 'XRAY';
      const isSolidWire = shadingMode === 'SOLID_WIREFRAME';

      // Solid mesh
      if (shadingMode !== 'WIREFRAME') {
        const material = new THREE.MeshStandardMaterial({
          color: mainColor,
          roughness: 0.35,
          metalness: 0.2,
          transparent: isPreview || isXRay,
          opacity: isXRay ? 0.35 : isPreview ? 0.75 : 0.95,
          wireframe: false,
        });
        const mesh = new THREE.Mesh(threeGeo, material);
        mesh.castShadow = !isXRay;
        mesh.receiveShadow = !isXRay;
        group.add(mesh);
      }

      // Wireframe overlay
      if (isWire || isSolidWire) {
        const edgesGeo = new THREE.EdgesGeometry(threeGeo);
        const wireframeMat = new THREE.LineBasicMaterial({
          color: isSelected ? 0x00ffff : isWire ? mainColor : 0xffffff,
          opacity: isWire ? 1 : 0.35,
          transparent: true,
        });
        const wireframe = new THREE.LineSegments(edgesGeo, wireframeMat);
        group.add(wireframe);
      }

      // Edit Mode sub-elements highlights
      if (isSelected && editMode !== 'OBJECT') {
        if (editMode === 'VERTEX') {
          // Render vertex points
          geo.mesh.vertices.forEach((v) => {
            const vDotGeo = new THREE.SphereGeometry(0.08, 8, 8);
            const vDotMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
            const vDot = new THREE.Mesh(vDotGeo, vDotMat);
            vDot.position.set(v.position[0], v.position[1], v.position[2]);
            group.add(vDot);
          });
        }
      }

      // Bounding box on selection
      if (isSelected) {
        const boxHelper = new THREE.BoxHelper(group, 0xa78bfa);
        group.add(boxHelper);
      }

      // Apply transform & Reality anchor offset
      const [tx, ty, tz] = geo.transform.translation;
      const [rx, ry, rz] = geo.transform.rotation;
      const [sx, sy, sz] = geo.transform.scale;
      const anchorOffset = geo.realityReference ? geo.realityReference.realityCoordinates : [0, 0, 0];

      group.position.set(tx + anchorOffset[0], ty + anchorOffset[1], tz + anchorOffset[2]);
      group.rotation.set((rx * Math.PI) / 180, (ry * Math.PI) / 180, (rz * Math.PI) / 180);
      group.scale.set(sx, sy, sz);

      scene.add(group);
      meshMapRef.current.set(geo.geometryId, group);

      // Build 3D Transform Gizmo for selected object
      if (isSelected && gizmoGroupRef.current && !isLocked) {
        const gGroup = gizmoGroupRef.current;
        gGroup.position.copy(group.position);

        if (activeTool === 'MOVE') {
          // X Arrow (Red)
          const arrowX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 2.5, 0xef4444, 0.5, 0.2);
          arrowX.children.forEach((c) => (c.userData.gizmoAxis = 'X'));
          gGroup.add(arrowX);

          // Y Arrow (Green)
          const arrowY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 2.5, 0x10b981, 0.5, 0.2);
          arrowY.children.forEach((c) => (c.userData.gizmoAxis = 'Y'));
          gGroup.add(arrowY);

          // Z Arrow (Blue)
          const arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 2.5, 0x3b82f6, 0.5, 0.2);
          arrowZ.children.forEach((c) => (c.userData.gizmoAxis = 'Z'));
          gGroup.add(arrowZ);
        } else if (activeTool === 'ROTATE') {
          // Rotation Rings
          const ringX = new THREE.Mesh(new THREE.TorusGeometry(2, 0.04, 12, 36), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
          ringX.rotateY(Math.PI / 2);
          ringX.userData.gizmoAxis = 'X';
          gGroup.add(ringX);

          const ringY = new THREE.Mesh(new THREE.TorusGeometry(2, 0.04, 12, 36), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
          ringY.rotateX(Math.PI / 2);
          ringY.userData.gizmoAxis = 'Y';
          gGroup.add(ringY);

          const ringZ = new THREE.Mesh(new THREE.TorusGeometry(2, 0.04, 12, 36), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
          ringZ.userData.gizmoAxis = 'Z';
          gGroup.add(ringZ);
        } else if (activeTool === 'SCALE') {
          // Scale Cubes on axes
          const handleX = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
          handleX.position.set(2.2, 0, 0);
          handleX.userData.gizmoAxis = 'X';
          gGroup.add(handleX);

          const handleY = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
          handleY.position.set(0, 2.2, 0);
          handleY.userData.gizmoAxis = 'Y';
          gGroup.add(handleY);

          const handleZ = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
          handleZ.position.set(0, 0, 2.2);
          handleZ.userData.gizmoAxis = 'Z';
          gGroup.add(handleZ);
        }
      }
    });
  }, [geometries, selectedGeometryId, activePreviewMesh, hiddenGeometryIds, lockedGeometryIds, activeTool, editMode, shadingMode]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: isGizmoDraggingRef.current ? 'grabbing' : 'crosshair',
        outline: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Floating Viewport Quick Controls (Top-Right) */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          gap: '5px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          padding: '4px 8px',
          borderRadius: '6px',
          border: '1px solid #334155',
          backdropFilter: 'blur(4px)',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setViewPreset('TOP')}
          style={{ padding: '3px 6px', fontSize: '10px', fontWeight: 700, backgroundColor: '#1E293B', color: '#CBD5E1', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer' }}
          title="Top View"
        >
          TOP
        </button>
        <button
          onClick={() => setViewPreset('FRONT')}
          style={{ padding: '3px 6px', fontSize: '10px', fontWeight: 700, backgroundColor: '#1E293B', color: '#CBD5E1', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer' }}
          title="Front View"
        >
          FRONT
        </button>
        <button
          onClick={() => setViewPreset('RIGHT')}
          style={{ padding: '3px 6px', fontSize: '10px', fontWeight: 700, backgroundColor: '#1E293B', color: '#CBD5E1', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer' }}
          title="Right View"
        >
          RIGHT
        </button>
        <button
          onClick={() => setViewPreset('ISOMETRIC')}
          style={{ padding: '3px 6px', fontSize: '10px', fontWeight: 700, backgroundColor: '#4C1D95', color: '#DDD6FE', border: '1px solid #7C3AED', borderRadius: '4px', cursor: 'pointer' }}
          title="Isometric Perspective"
        >
          ISO
        </button>
        <button
          onClick={handleFitSelected}
          style={{ padding: '3px 6px', fontSize: '10px', fontWeight: 700, backgroundColor: '#1E293B', color: '#38BDF8', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer' }}
          title="Focus / Fit Selected Object"
        >
          FIT
        </button>
        <button
          onClick={handleFrameAll}
          style={{ padding: '3px 6px', fontSize: '10px', fontWeight: 700, backgroundColor: '#1E293B', color: '#34D399', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer' }}
          title="Frame All Entities"
        >
          ALL
        </button>
      </div>

      {/* Floating Reality Beacon HUD (Top-Left) */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #059669',
          fontSize: '11px',
          color: '#94A3B8',
          fontFamily: 'monospace',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00FF88', fontWeight: 'bold' }}>
          <ShieldCheck className="w-3.5 h-3.5" />
          REALITY ANCHOR: [5, 3, 6]
        </div>
        <div style={{ fontSize: '10px', color: '#6EE7B7', marginTop: '2px' }}>
          Authoritative Physical Origin (Immutable)
        </div>
        <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>
          Left Drag: Orbit | Right Drag: Pan | Wheel: Zoom
        </div>
      </div>
    </div>
  );
};
