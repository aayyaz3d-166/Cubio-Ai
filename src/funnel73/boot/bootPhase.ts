/**
 * 3D Memory Studio — Funnel 73
 * Boot Phase Constants & Ordering
 */

import { BootPhase, BootPhaseRecord } from '../types';

export const DEFAULT_PHASE_TIMEOUT_MS = 10000;
export const DEFAULT_GLOBAL_TIMEOUT_MS = 30000;

export const ORDERED_BOOT_PHASES: readonly BootPhase[] = [
  'UNMOUNTED',
  'MOUNTING',
  'ROOT_READY',
  'BOOTSTRAPPING',
  'CHECKING_RENDERER',
  'CHECKING_SCENE',
  'CHECKING_STUDIO',
  'CHECKING_RUNTIME',
  'ACTIVATING_F72',
  'READY',
];

export const INITIAL_PHASE_RECORDS: readonly BootPhaseRecord[] = [
  {
    phase: 'UNMOUNTED',
    name: 'Browser Environment Mount',
    isRequired: true,
    timeoutMs: DEFAULT_PHASE_TIMEOUT_MS,
    status: 'PENDING',
  },
  {
    phase: 'MOUNTING',
    name: 'React Application Mount',
    isRequired: true,
    timeoutMs: DEFAULT_PHASE_TIMEOUT_MS,
    status: 'PENDING',
  },
  {
    phase: 'ROOT_READY',
    name: 'DOM Root Container Verification',
    isRequired: true,
    timeoutMs: DEFAULT_PHASE_TIMEOUT_MS,
    status: 'PENDING',
  },
  {
    phase: 'BOOTSTRAPPING',
    name: 'Core Runtime Bootstrap',
    isRequired: true,
    timeoutMs: DEFAULT_PHASE_TIMEOUT_MS,
    status: 'PENDING',
  },
  {
    phase: 'CHECKING_RENDERER',
    name: 'F55 Three.js Master Renderer',
    isRequired: true,
    timeoutMs: DEFAULT_PHASE_TIMEOUT_MS,
    status: 'PENDING',
  },
  {
    phase: 'CHECKING_SCENE',
    name: 'F56 Spatial Scene Graph',
    isRequired: true,
    timeoutMs: DEFAULT_PHASE_TIMEOUT_MS,
    status: 'PENDING',
  },
  {
    phase: 'CHECKING_STUDIO',
    name: 'F65 Studio Shell & Workspaces',
    isRequired: true,
    timeoutMs: DEFAULT_PHASE_TIMEOUT_MS,
    status: 'PENDING',
  },
  {
    phase: 'CHECKING_RUNTIME',
    name: 'Single RAF & Resource Isolation',
    isRequired: true,
    timeoutMs: DEFAULT_PHASE_TIMEOUT_MS,
    status: 'PENDING',
  },
  {
    phase: 'ACTIVATING_F72',
    name: 'F72 Runtime Activation Pipeline',
    isRequired: true,
    timeoutMs: DEFAULT_PHASE_TIMEOUT_MS,
    status: 'PENDING',
  },
  {
    phase: 'READY',
    name: 'Application Operational Readiness',
    isRequired: true,
    timeoutMs: DEFAULT_PHASE_TIMEOUT_MS,
    status: 'PENDING',
  },
];
