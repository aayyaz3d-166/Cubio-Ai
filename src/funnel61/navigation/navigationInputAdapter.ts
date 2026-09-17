/**
 * 3D Memory Studio — Funnel 61
 * Navigation Input Adapter
 *
 * Abstract action dispatcher decoupleable from browser DOM events.
 */

import { CameraPresetType } from '../types';

export type NavigationAction =
  | { type: 'ORBIT'; deltaYaw: number; deltaPitch: number }
  | { type: 'PAN'; deltaX: number; deltaY: number }
  | { type: 'ZOOM'; deltaDistance: number }
  | { type: 'FOCUS'; targetId: string; position: [number, number, number]; radius?: number }
  | { type: 'PRESET'; preset: CameraPresetType }
  | { type: 'RESET' };
