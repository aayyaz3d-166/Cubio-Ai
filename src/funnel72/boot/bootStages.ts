/**
 * 3D Memory Studio — Funnel 72
 * Boot Stages Definitions & Descriptors
 */

import { BootStageId, StageDescriptor } from '../types';

export const REQUIRED_TIMEOUT_MS = 10000;
export const OPTIONAL_TIMEOUT_MS = 5000;

export const BOOT_STAGE_DESCRIPTORS: readonly StageDescriptor[] = [
  {
    id: 'APPLICATION',
    name: 'Browser Application Shell',
    isRequired: true,
    timeoutMs: REQUIRED_TIMEOUT_MS,
    description: 'Initializes DOM mount point and core client runtime environment',
  },
  {
    id: 'SECURITY',
    name: 'F47 Security Policy Gate',
    isRequired: true,
    timeoutMs: REQUIRED_TIMEOUT_MS,
    description: 'Enforces DataClassification boundaries and protection mechanisms',
  },
  {
    id: 'RENDERER',
    name: 'F55 Three.js Master Renderer',
    isRequired: true,
    timeoutMs: REQUIRED_TIMEOUT_MS,
    description: 'Initializes WebGL/Three.js render loop without duplicate canvas creation',
  },
  {
    id: 'SCENE',
    name: 'F56 Spatial Scene Graph Engine',
    isRequired: true,
    timeoutMs: REQUIRED_TIMEOUT_MS,
    description: 'Constructs 3D spatial scene hierarchies and scene lighting',
  },
  {
    id: 'CAMERA',
    name: 'F61 Spatial Camera Engine',
    isRequired: true,
    timeoutMs: REQUIRED_TIMEOUT_MS,
    description: 'Validates bounded perspective camera, target vectors, and presets',
  },
  {
    id: 'STUDIO_SHELL',
    name: 'F65 Studio Frontend Shell',
    isRequired: true,
    timeoutMs: REQUIRED_TIMEOUT_MS,
    description: 'Mounts dark spatial UI container and responsive layout frame',
  },
  {
    id: 'WORKSPACE',
    name: 'F66 Navigation & Panel Orchestrator',
    isRequired: true,
    timeoutMs: REQUIRED_TIMEOUT_MS,
    description: 'Activates panel system, section navigation, and 3D viewport binding',
  },
  {
    id: 'DIMENSION',
    name: 'F60 Dimension & Projection Engine',
    isRequired: false,
    timeoutMs: OPTIONAL_TIMEOUT_MS,
    description: 'Initializes Z3 physical spatial mode and Z4+ computational projections',
  },
  {
    id: 'DATABASE',
    name: 'F67 Database & Information UI',
    isRequired: false,
    timeoutMs: OPTIONAL_TIMEOUT_MS,
    description: 'Initializes record explorer, metadata inspector, and search filters',
  },
  {
    id: 'AI',
    name: 'F69 AI Chat & Multi-LLM Layer',
    isRequired: false,
    timeoutMs: OPTIONAL_TIMEOUT_MS,
    description: 'Initializes LLM provider registry, model selectors, and conversation context',
  },
  {
    id: 'ACTIONS',
    name: 'F70 Studio Action & Command Engine',
    isRequired: false,
    timeoutMs: OPTIONAL_TIMEOUT_MS,
    description: 'Initializes natural language command parser and structured action queue',
  },
  {
    id: 'PERSISTENCE',
    name: 'F71 Persistent Studio Data Layer',
    isRequired: false,
    timeoutMs: OPTIONAL_TIMEOUT_MS,
    description: 'Initializes persistent record storage, hydration, and versioning',
  },
  {
    id: 'READY',
    name: 'Studio Operational Readiness',
    isRequired: true,
    timeoutMs: REQUIRED_TIMEOUT_MS,
    description: 'Final transition into active Studio runtime',
  },
];

export const ORDERED_BOOT_STAGES: readonly BootStageId[] = BOOT_STAGE_DESCRIPTORS.map((d) => d.id);

export const REQUIRED_STAGES: ReadonlySet<BootStageId> = new Set(
  BOOT_STAGE_DESCRIPTORS.filter((d) => d.isRequired).map((d) => d.id)
);

export const OPTIONAL_STAGES: ReadonlySet<BootStageId> = new Set(
  BOOT_STAGE_DESCRIPTORS.filter((d) => !d.isRequired).map((d) => d.id)
);
