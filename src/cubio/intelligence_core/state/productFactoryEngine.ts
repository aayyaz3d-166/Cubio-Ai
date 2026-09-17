/**
 * CUBiO AI — Phase 25: Product Factory Pipeline Engine
 * Protocol: CUBIO-P25-INTELLIGENCE-CORE-GENESIS-001
 * 
 * Manages the 9-stage innovation pipeline:
 * PROBLEM -> RESEARCH -> HYPOTHESIS -> DESIGN -> PROTOTYPE -> SIMULATION -> TEST -> VALIDATION -> PRODUCT CANDIDATE
 */

import { ProductFactoryStage, ProductFactoryPipelineItem } from '../types';

export const ORDERED_PRODUCT_STAGES: readonly ProductFactoryStage[] = [
  'PROBLEM',
  'RESEARCH',
  'HYPOTHESIS',
  'DESIGN',
  'PROTOTYPE',
  'SIMULATION',
  'TEST',
  'VALIDATION',
  'PRODUCT_CANDIDATE',
] as const;

export function getInitialProductFactoryPipeline(): readonly ProductFactoryPipelineItem[] {
  return Object.freeze([
    {
      id: 'PROD-01',
      productName: 'CUBiO Intelligence',
      currentStage: 'PRODUCT_CANDIDATE',
      progressPct: 100,
      hypothesisSummary: 'Sovereign conversational & reasoning substrate on native P24 model.',
      validationPassed: true,
      stagesCompleted: [...ORDERED_PRODUCT_STAGES],
    },
    {
      id: 'PROD-02',
      productName: 'CUBiO Network',
      currentStage: 'PRODUCT_CANDIDATE',
      progressPct: 100,
      hypothesisSummary: 'Decentralized spatial mesh routing with state synchronization.',
      validationPassed: true,
      stagesCompleted: [...ORDERED_PRODUCT_STAGES],
    },
    {
      id: 'PROD-03',
      productName: 'CUBiO Vision',
      currentStage: 'VALIDATION',
      progressPct: 88.9,
      hypothesisSummary: 'Spatial 3D depth field reconstruction from discrete 343 lattice states.',
      validationPassed: true,
      stagesCompleted: ORDERED_PRODUCT_STAGES.slice(0, 8),
    },
    {
      id: 'PROD-04',
      productName: 'CUBiO Audio',
      currentStage: 'SIMULATION',
      progressPct: 66.7,
      hypothesisSummary: 'Euler harmonic modal audio synthesis aligned with 369 frequency peaks.',
      validationPassed: false,
      stagesCompleted: ORDERED_PRODUCT_STAGES.slice(0, 6),
    },
    {
      id: 'PROD-05',
      productName: 'CUBiO 3D Studio',
      currentStage: 'PROTOTYPE',
      progressPct: 55.6,
      hypothesisSummary: 'Direct tactile spatial memory visualization and manipulation.',
      validationPassed: false,
      stagesCompleted: ORDERED_PRODUCT_STAGES.slice(0, 5),
    },
    {
      id: 'PROD-06',
      productName: 'CUBiO Robotics',
      currentStage: 'RESEARCH',
      progressPct: 22.2,
      hypothesisSummary: 'Fail-closed motor schema planning under permanent physical actuation lock.',
      validationPassed: false,
      stagesCompleted: ORDERED_PRODUCT_STAGES.slice(0, 2),
    },
  ]);
}

/**
 * Advances a product item to its next pipeline stage
 */
export function advanceProductStage(
  item: ProductFactoryPipelineItem
): ProductFactoryPipelineItem {
  const currentIndex = ORDERED_PRODUCT_STAGES.indexOf(item.currentStage);
  if (currentIndex === ORDERED_PRODUCT_STAGES.length - 1) {
    return item; // Already at final candidate stage
  }

  const nextStage = ORDERED_PRODUCT_STAGES[currentIndex + 1];
  const newCompleted = [...item.stagesCompleted, nextStage];
  const progressPct = parseFloat(
    ((newCompleted.length / ORDERED_PRODUCT_STAGES.length) * 100).toFixed(1)
  );

  return {
    ...item,
    currentStage: nextStage,
    progressPct,
    stagesCompleted: Object.freeze(newCompleted),
    validationPassed: nextStage === 'PRODUCT_CANDIDATE' ? true : item.validationPassed,
  };
}
