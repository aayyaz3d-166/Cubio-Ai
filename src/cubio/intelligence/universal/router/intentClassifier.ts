/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F57: Deep Intent Classifier & Problem Type Analyzer
 *
 * Categorizes user request intent, problem complexity, and required capability classes.
 */

import { UniversalCapabilityClass } from '../universalTypes';
import { ProblemComplexityType } from './types';

export interface ClassifiedIntent {
  readonly intent: string;
  readonly problemType: ProblemComplexityType;
  readonly requiredCapabilities: readonly UniversalCapabilityClass[];
  readonly confidence: number;
}

export function classifyUserIntent(prompt: string): ClassifiedIntent {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // 1. Multi-Agent Solve (Complex multi-disciplinary challenges)
  if (
    /multi.?agent|collaborat|team of agents|research.*code.*design|architect.*visualizer|end-to-end system/i.test(lower)
  ) {
    return {
      intent: 'MULTI_AGENT_SOLVE',
      problemType: 'MULTI_AGENT_COORDINATION',
      requiredCapabilities: ['MULTI_AGENT_PROBLEM_SOLVING', 'LLM_REASONING', 'CODE_GENERATION'],
      confidence: 0.98,
    };
  }

  // 2. Workflow Multi-Stage Execution
  if (
    /website bana do|banao|create workflow|plan.*design.*code|deploy.*app|build.*platform/i.test(lower) &&
    !/explain|what is|how does/i.test(lower)
  ) {
    return {
      intent: 'WORKFLOW_EXECUTION',
      problemType: 'COMPOSITE_WORKFLOW',
      requiredCapabilities: ['WORKFLOW_EXECUTION', 'PROJECT_ASSISTANCE'],
      confidence: 0.96,
    };
  }

  // 3. Image Intelligence & Generation
  if (/generate image|draw|render svg|illustration|tesseract graphic|picture of/i.test(lower)) {
    return {
      intent: 'IMAGE_GENERATION',
      problemType: 'ATOMIC_QUERY',
      requiredCapabilities: ['IMAGE_GENERATION', 'VISION'],
      confidence: 0.97,
    };
  }

  // 4. Voice Intelligence & Audio
  if (/speak|voice|transcribe audio|synthesize speech|solfeggio wav|record voice/i.test(lower)) {
    return {
      intent: 'VOICE_INTERACTION',
      problemType: 'ATOMIC_QUERY',
      requiredCapabilities: ['VOICE_INPUT', 'VOICE_OUTPUT'],
      confidence: 0.96,
    };
  }

  // 5. Controlled Tool Execution (explicit tool invocations)
  if (/terminal_exec|run command|fetch url|read file|dir_list|delete file|http request|web_fetch|web_search/i.test(lower)) {
    return {
      intent: 'TOOL_INVOCATION',
      problemType: 'ATOMIC_QUERY',
      requiredCapabilities: ['WORKFLOW_EXECUTION'],
      confidence: 0.95,
    };
  }

  // 6. Code Engineering (Generation, Debugging, Refactoring, Tests)
  if (/generate code|implement|typescript|python|debug|fix bug|refactor|unit test|glsl shader/i.test(lower)) {
    return {
      intent: 'CODE_ENGINEERING',
      problemType: 'ATOMIC_QUERY',
      requiredCapabilities: ['CODE_GENERATION', 'CODE_ANALYSIS', 'CODE_DEBUGGING'],
      confidence: 0.97,
    };
  }

  // 7. Project Understanding & Structure
  if (/analyze project|project files|dependency graph|health score|modularity index/i.test(lower)) {
    return {
      intent: 'PROJECT_UNDERSTANDING',
      problemType: 'ATOMIC_QUERY',
      requiredCapabilities: ['PROJECT_ASSISTANCE', 'FILE_ANALYSIS'],
      confidence: 0.95,
    };
  }

  // 8. 3-6-9 Harmonic, Geometry & 4D Spatial Computing
  if (
    /spatial|geometric|coordinate.*transform|quaternion|euler angle|affine matrix|369|digital root|vortex flux|tesseract|hypercube|stereographic projection|manifold|topology|voxel.*grid|bounding box/i.test(
      lower
    )
  ) {
    return {
      intent: 'SPATIAL_369_COMPUTE',
      problemType: 'SPATIAL_TRANSFORMATION',
      requiredCapabilities: ['SPATIAL_REASONING', 'GEOMETRIC_REASONING', 'HARMONIC_369'],
      confidence: 0.99,
    };
  }

  // 9. Standard Natural Response & Chat
  return {
    intent: 'NATURAL_CONVERSATION',
    problemType: 'ATOMIC_QUERY',
    requiredCapabilities: ['NATURAL_LANGUAGE'],
    confidence: 0.92,
  };
}
