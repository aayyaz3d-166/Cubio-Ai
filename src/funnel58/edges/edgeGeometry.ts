/**
 * 3D Memory Studio — Funnel 58
 * Edge Geometry Generators (Straight & Curved Bezier)
 */

import * as THREE from 'three';
import { GraphEdgeForm } from '../types';

export function createStraightEdgeGeometry(
  src: [number, number, number],
  tgt: [number, number, number]
): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array([
    src[0], src[1], src[2],
    tgt[0], tgt[1], tgt[2],
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
}

export function createCurvedEdgeGeometry(
  src: [number, number, number],
  tgt: [number, number, number],
  curveOffset = 15,
  segments = 16
): THREE.BufferGeometry {
  const vSrc = new THREE.Vector3(src[0], src[1], src[2]);
  const vTgt = new THREE.Vector3(tgt[0], tgt[1], tgt[2]);

  // Midpoint with upward/lateral offset
  const mid = new THREE.Vector3().addVectors(vSrc, vTgt).multiplyScalar(0.5);
  const dir = new THREE.Vector3().subVectors(vTgt, vSrc).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const normal = new THREE.Vector3().crossVectors(dir, up).normalize();

  mid.addScaledVector(up, curveOffset * 0.7);
  mid.addScaledVector(normal, curveOffset * 0.3);

  const curve = new THREE.QuadraticBezierCurve3(vSrc, mid, vTgt);
  const points = curve.getPoints(segments);

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  return geo;
}

export function updateEdgeGeometryBuffer(
  geo: THREE.BufferGeometry,
  form: GraphEdgeForm,
  src: [number, number, number],
  tgt: [number, number, number]
): void {
  if (form === 'STRAIGHT') {
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    if (posAttr && posAttr.array.length >= 6) {
      const arr = posAttr.array as Float32Array;
      arr[0] = src[0]; arr[1] = src[1]; arr[2] = src[2];
      arr[3] = tgt[0]; arr[4] = tgt[1]; arr[5] = tgt[2];
      posAttr.needsUpdate = true;
    }
  } else {
    const newGeo = createCurvedEdgeGeometry(src, tgt);
    geo.copy(newGeo);
    newGeo.dispose();
  }
}
