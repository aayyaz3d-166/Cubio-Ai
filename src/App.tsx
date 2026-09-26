/**
 * 3D Memory Studio - Main Application
 * Experimental 3D Spatial Memory Environment & 369 Address System
 */

import React, { useState, useCallback } from 'react';
import {
  Coordinate3D,
  DecodeResult,
  EncodeResult,
  MemoryBlock,
  MemoryCell,
  MemoryGrid3D,
  MemoryLevel,
  RootMemory,
  TrajectoryPath,
} from './types';
import { PatternRule } from './types/patterns';
import { PatternOptimizationResult } from './types/optimizer';
import { createEmptyMemoryGrid } from './core/memoryGrid';
import { encodeToHierarchicalMemory } from './core/hierarchicalMemory';
import { decodeHierarchicalMemory, decode3DMemoryToText } from './core/decoder';
import { ThreeCanvas } from './components/ThreeCanvas';
import { Header } from './components/Header';
import { EncoderDecoderPanel } from './components/EncoderDecoderPanel';
import { InspectorPanel } from './components/InspectorPanel';
import { ResearchModePanel } from './components/ResearchModePanel';
import { BinaryComparisonPanel } from './components/BinaryComparisonPanel';
import { SpatialPatternPanel } from './components/SpatialPatternPanel';
import { RuleOptimizerPanel } from './components/RuleOptimizerPanel';
import { SpatialEncoderPanel } from './components/SpatialEncoderPanel';
import { SpatialDecoderPanel } from './components/SpatialDecoderPanel';
import { SpatialDictionaryPanel } from './components/SpatialDictionaryPanel';
import { SpatialHierarchyPanel } from './components/SpatialHierarchyPanel';
import { CompressionBenchmarkPanel } from './components/CompressionBenchmarkPanel';
import { CanonicalSignaturePanel } from './components/CanonicalSignaturePanel';
import { CompositeDiscoveryPanel } from './components/CompositeDiscoveryPanel';
import { CompositeProfitabilityPanel } from './components/CompositeProfitabilityPanel';
import { CompactDecoderPanel } from './components/CompactDecoderPanel';
import { ResearchStudioNav, StudioTab } from './components/ResearchStudioNav';
import { TestSuiteModal } from './components/TestSuiteModal';
import { FunnelArchitectureView } from './components/FunnelArchitectureView';
import { MemoryTreePanel } from './components/MemoryTreePanel';
import { EulerMemoryPanel } from './components/EulerMemoryPanel';
import { FractalVSSDStudio } from './components/FractalVSSDStudio';
import { ENABLE_EULER_MEMORY_EXPERIMENT } from './config/eulerConfig';
import { PlanSegment, ViewportMode, BlockEncodingPlan } from './types/spatialEncoder';
import { SpatialDecodeResult, ViewportDiffMode } from './types/spatialDecoder';
import { CompositeCandidate, CompositeEntry } from './types/spatialHierarchy';
import { encodeToSpatialCompact } from './core/spatialEncoder';
import { decodeCompactBinary } from './core/spatialDecoder';
import { InformationUniverseStudio } from './funnel46';
import { StudioRuntimeApp } from './funnel65';
import { F83ResearchHarness } from './research/observable_reality/f83/ui/F83ResearchHarness';
import { F84ResearchHarness } from './research/observable_reality/f84/ui/F84ResearchHarness';
import { F85ResearchHarness } from './research/observable_reality/f85/ui/F85ResearchHarness';
import { F86ResearchHarness } from './research/observable_reality/f86/ui/F86ResearchHarness';
import { F87ResearchHarness } from './research/observable_reality/f87/ui/F87ResearchHarness';
import { F88ResearchHarness } from './research/observable_reality/f88/ui/F88ResearchHarness';
import { F89ResearchHarness } from './research/observable_reality/f89/ui/F89ResearchHarness';
import { P51ResearchHarness } from './research/observation_reconstruction/p51/ui/P51ResearchHarness';
import { P52ResearchHarness } from './research/observation_reconstruction/p52/ui/P52ResearchHarness';
import { P61ResearchHarness } from './research/user_workspace/p61/ui/P61ResearchHarness';
import { P62ResearchHarness } from './research/user_workspace/p62/ui/P62ResearchHarness';
import { P63ResearchHarness } from './research/user_workspace/p63/ui/P63ResearchHarness';
import { P64ResearchHarness } from './research/user_workspace/p64/ui/P64ResearchHarness';
import { P65ResearchHarness } from './research/user_workspace/p65/ui/P65ResearchHarness';
import { P66ResearchHarness } from './research/user_workspace/p66/ui/P66ResearchHarness';
import { P67ResearchHarness } from './research/user_workspace/p67/ui/P67ResearchHarness';
import { P68ResearchHarness } from './research/user_workspace/p68/ui/P68ResearchHarness';
import { P69ResearchHarness } from './research/user_workspace/p69/ui/P69ResearchHarness';
import { P610ResearchHarness } from './research/user_workspace/p610/ui/P610ResearchHarness';
import { P612ResearchHarness } from './research/user_workspace/p612/ui/P612ResearchHarness';
import { P613ResearchHarness } from './research/user_workspace/p613/ui/P613ResearchHarness';
import { P614ResearchHarness } from './research/user_workspace/p614/ui/P614ResearchHarness';
import P615ResearchHarness from './research/user_workspace/p615/ui/P615ResearchHarness';
import P616ResearchHarness from './research/user_workspace/p616/ui/P616ResearchHarness';
import P620ResearchHarness from './research/user_workspace/p620/ui/P620ResearchHarness';
import P621ResearchHarness from './research/user_workspace/p621/ui/P621ResearchHarness';
import P623ResearchHarness from './research/user_workspace/p623/ui/P623ResearchHarness';
import P624ResearchHarness from './research/user_workspace/p624/ui/P624ResearchHarness';
import P625ILiveWorkspace from './research/user_workspace/p625i/ui/P625ILiveWorkspace';
import { P625JResearchHarness } from './research/user_workspace/p625j/ui/P625JResearchHarness';
import { R1ResearchHarness } from './research/reality_integration/r1/ui/R1ResearchHarness';
import { R2ResearchHarness } from './research/reality_integration/r2/ui/R2ResearchHarness';
import { R3ResearchHarness } from './research/reality_integration/r3/ui/R3ResearchHarness';
import { R4ResearchHarness } from './research/reality_integration/r4/ui/R4ResearchHarness';
import { R5ResearchHarness } from './research/reality_integration/r5/ui/R5ResearchHarness';
import { R6ResearchHarness } from './research/reality_integration/r6/ui/R6ResearchHarness';
import { R7ResearchStudioApp } from './research/reality_integration/r7/ui/R7ResearchStudioApp';
import { R8ResearchStudioApp } from './research/reality_integration/r8/ui/R8ResearchStudioApp';
import { R9ResearchStudioApp } from './research/reality_integration/r9/ui/R9ResearchStudioApp';
import { R10RealityAIApp } from './research/reality_integration/f10';
import { R11ResearchStudio } from './research/reality_integration/f11';
import { CubiOStudioApp } from './cubio/studio/CubiOStudioApp';
import { CubiOIntelligenceApp } from './cubio/intelligence/CubiOIntelligenceApp';
import { CubiONetworkApp } from './cubio/network/CubiONetworkApp';
import { CubiOWebStudioApp } from './cubio/web';
import { IntelligenceCoreShell } from './cubio/intelligence_core';
import {
  Boxes,
  Compass,
  FileCode,
  FileCheck,
  Layers,
  BarChart3,
  Crosshair,
  Sparkles,
  Info,
  CheckCircle2,
  Workflow,
  Network,
  Database,
  SlidersHorizontal,
  Cpu,
  Scale,
  BookOpen,
  Fingerprint,
} from 'lucide-react';

export default function App() {
  // Phase 21 Web MVP Default Landing Route Handler:
  // Defaults to Web Studio for direct live Web MVP conversational experience;
  // Explicit modes (?mode=core, ?mode=studio, ?mode=f11, etc.) route to their respective workspaces.
  const [inWebStudio, setInWebStudio] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();

    // Explicit other modes route away from Web Studio
    if (
      search.includes('mode=core') ||
      search.includes('mode=intelligence') ||
      search.includes('mode=studio') ||
      search.includes('mode=network') ||
      search.includes('mode=f11') ||
      search.includes('mode=f10') ||
      search.includes('mode=r9') ||
      search.includes('mode=legacy') ||
      hash.includes('#core') ||
      hash.includes('#intelligence') ||
      hash.includes('#studio') ||
      hash.includes('#network') ||
      hash.includes('#f11') ||
      hash.includes('#legacy')
    ) {
      return false;
    }
    return true; // Default Web MVP Experience: Web Studio
  });

  // Explicit Sovereign Mother Interface Route Handler (?mode=core or #core)
  const [inIntelligenceCore, setInIntelligenceCore] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return search.includes('mode=core') || hash.includes('#core');
  });

  // Explicit CUBiO AI Intelligence Workspace (?mode=intelligence)
  const [inCubiOIntelligence, setInCubiOIntelligence] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return search.includes('mode=intelligence') || hash.includes('#intelligence');
  });

  // Explicit CUBiO Networking Workspace Route Handler (/cubio/network or ?mode=network)
  const [inCubiONetwork, setInCubiONetwork] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    return (
      search.includes('mode=network') ||
      search.includes('workspace=network') ||
      hash.includes('/cubio/network') ||
      hash.includes('network') ||
      path.includes('/cubio/network') ||
      path.endsWith('/network')
    );
  });

  // Explicit Studio Route Handler (?mode=studio)
  const [inCubiOStudio, setInCubiOStudio] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    return (
      search.includes('mode=studio') ||
      search.includes('workspace=studio') ||
      hash.includes('studio')
    );
  });


  // Explicit Highest-Priority F11 Spatial World Model, F10 Reality AI & R9 Studio Route Handler
  const [inF11Studio, setInF11Studio] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    return (
      search.includes('mode=f11') ||
      search.includes('research=f11') ||
      hash.includes('mode=f11') ||
      hash.includes('research=f11') ||
      hash.includes('/research/f11') ||
      hash.includes('#/research/f11') ||
      hash === '#f11' ||
      hash === '#/f11' ||
      path.includes('/f11') ||
      path.endsWith('f11')
    );
  });

  const [inF10Studio, setInF10Studio] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    return (
      search.includes('mode=f10') ||
      search.includes('research=f10') ||
      hash.includes('mode=f10') ||
      hash.includes('research=f10') ||
      hash.includes('/research/f10') ||
      hash.includes('#/research/f10') ||
      hash === '#f10' ||
      hash === '#/f10' ||
      path.includes('/f10') ||
      path.endsWith('f10')
    );
  });

  const [inR9Studio, setInR9Studio] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    return (
      search.includes('mode=r9') ||
      search.includes('research=r9') ||
      hash.includes('mode=r9') ||
      hash.includes('research=r9') ||
      hash.includes('/research/r9') ||
      hash.includes('#/research/r9') ||
      hash === '#r9' ||
      hash === '#/r9' ||
      path.includes('/r9') ||
      path.endsWith('r9')
    );
  });

  // Dynamic URL / Hash change listener
  React.useEffect(() => {
    const handleUrlChange = () => {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();

      const isExplicitOther = (
        search.includes('mode=core') ||
        search.includes('mode=intelligence') ||
        search.includes('mode=studio') ||
        search.includes('mode=network') ||
        search.includes('mode=f11') ||
        search.includes('mode=f10') ||
        search.includes('mode=r9') ||
        search.includes('mode=legacy') ||
        hash.includes('#core') ||
        hash.includes('#intelligence') ||
        hash.includes('#studio') ||
        hash.includes('#network') ||
        hash.includes('#f11') ||
        hash.includes('#legacy')
      );

      const isWebStudio = (
        !isExplicitOther ||
        search.includes('mode=web-studio') ||
        search.includes('mode=chat') ||
        search.includes('workspace=web-studio') ||
        hash.includes('web-studio') ||
        hash.includes('chat') ||
        path.includes('/web-studio') ||
        path.includes('/chat')
      );
      setInWebStudio(isWebStudio);

      const isStudio = (
        search.includes('mode=studio') ||
        search.includes('workspace=studio') ||
        hash.includes('#studio')
      );
      setInCubiOStudio(isStudio);

      const isNetwork = (
        search.includes('mode=network') ||
        search.includes('workspace=network') ||
        hash.includes('/cubio/network') ||
        hash.includes('network') ||
        path.includes('/cubio/network') ||
        path.endsWith('/network')
      );
      setInCubiONetwork(isNetwork);

      const isCore = (
        search.includes('mode=core') ||
        hash.includes('#core') ||
        (!search.includes('mode=intelligence') &&
         !isWebStudio &&
         !isStudio &&
         !isNetwork &&
         !search.includes('mode=f') &&
         !search.includes('mode=r') &&
         !search.includes('mode=legacy') &&
         !hash.includes('#') &&
         path === '/')
      );
      setInIntelligenceCore(isCore);

      const isIntelligence = (
        search.includes('mode=intelligence') ||
        hash.includes('#intelligence')
      );
      setInCubiOIntelligence(isIntelligence);


      const isF11 = (
        search.includes('mode=f11') ||
        search.includes('research=f11') ||
        hash.includes('mode=f11') ||
        hash.includes('research=f11') ||
        hash.includes('/research/f11') ||
        hash.includes('#/research/f11') ||
        hash === '#f11' ||
        hash === '#/f11' ||
        path.includes('/f11') ||
        path.endsWith('f11')
      );
      setInF11Studio(isF11);

      const isF10 = (
        search.includes('mode=f10') ||
        search.includes('research=f10') ||
        hash.includes('mode=f10') ||
        hash.includes('research=f10') ||
        hash.includes('/research/f10') ||
        hash.includes('#/research/f10') ||
        hash === '#f10' ||
        hash === '#/f10' ||
        path.includes('/f10') ||
        path.endsWith('f10')
      );
      setInF10Studio(isF10);

      const isR9 = (
        search.includes('mode=r9') ||
        search.includes('research=r9') ||
        hash.includes('mode=r9') ||
        hash.includes('research=r9') ||
        hash.includes('/research/r9') ||
        hash.includes('#/research/r9') ||
        hash === '#r9' ||
        hash === '#/r9' ||
        path.includes('/r9') ||
        path.endsWith('r9')
      );
      setInR9Studio(isR9);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  if (inWebStudio) {
    return (
      <CubiOWebStudioApp
        onNavigateTo3DStudio={() => {
          setInWebStudio(false);
          setInCubiOStudio(true);
          window.history.pushState(null, '', '/?mode=studio');
        }}
      />
    );
  }

  if (inIntelligenceCore) {
    return (
      <IntelligenceCoreShell
        onNavigateToIntelligence={() => {
          setInIntelligenceCore(false);
          setInCubiOIntelligence(true);
          window.history.pushState(null, '', '/?mode=intelligence');
        }}
        onNavigateToNetwork={() => {
          setInIntelligenceCore(false);
          setInCubiONetwork(true);
          window.history.pushState(null, '', '/?mode=network');
        }}
        onNavigateToStudio={() => {
          setInIntelligenceCore(false);
          setInCubiOStudio(true);
          window.history.pushState(null, '', '/?mode=studio');
        }}
      />
    );
  }

  if (inCubiOIntelligence) {
    return (
      <CubiOIntelligenceApp
        onExitToCore={() => {
          setInCubiOIntelligence(false);
          setInIntelligenceCore(true);
          window.history.pushState(null, '', '/?mode=core');
        }}
        onExitToNetwork={() => {
          setInCubiOIntelligence(false);
          setInCubiONetwork(true);
          window.history.pushState(null, '', '/?mode=network');
        }}
      />
    );
  }

  if (inCubiONetwork) {
    return (
      <CubiONetworkApp
        onExit={() => {
          setInCubiONetwork(false);
          setInIntelligenceCore(true);
          window.history.pushState(null, '', '/?mode=core');
        }}
      />
    );
  }

  if (inCubiOStudio) {
    return (
      <CubiOStudioApp
        onExit={() => {
          setInCubiOStudio(false);
          setInIntelligenceCore(true);
          window.history.pushState(null, '', '/?mode=core');
        }}
        onNavigateToIntelligence={() => {
          setInCubiOStudio(false);
          setInCubiOIntelligence(true);
          window.history.pushState(null, '', '/?mode=intelligence');
        }}
        onNavigateToNetwork={() => {
          setInCubiOStudio(false);
          setInCubiONetwork(true);
          window.history.pushState(null, '', '/?mode=network');
        }}
      />
    );
  }

  if (inF11Studio) {
    return (
      <R11ResearchStudio
        onExit={() => {
          setInF11Studio(false);
          window.history.pushState(null, '', window.location.pathname);
        }}
      />
    );
  }

  if (inF10Studio) {
    return (
      <R10RealityAIApp
        onExit={() => {
          setInF10Studio(false);
          window.history.pushState(null, '', window.location.pathname);
        }}
      />
    );
  }

  if (inR9Studio) {
    return (
      <R9ResearchStudioApp
        onExit={() => {
          setInR9Studio(false);
          window.history.pushState(null, '', window.location.pathname);
        }}
      />
    );
  }

  const [isRuntimeActive, setIsRuntimeActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return (
      !window.location.search.includes('view=legacy') &&
      !window.location.search.includes('mode=harness')
    );
  });

  const [inF83Harness, setInF83Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('f83') ||
      window.location.hash.includes('f83') ||
      window.location.search.includes('mode=f83') ||
      window.location.search.includes('research=f83')
    );
  });

  const [inF84Harness, setInF84Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('f84') ||
      window.location.hash.includes('f84') ||
      window.location.search.includes('mode=f84') ||
      window.location.search.includes('research=f84')
    );
  });

  const [inF85Harness, setInF85Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('f85') ||
      window.location.hash.includes('f85') ||
      window.location.search.includes('mode=f85') ||
      window.location.search.includes('research=f85')
    );
  });

  const [inF86Harness, setInF86Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('f86') ||
      window.location.hash.includes('f86') ||
      window.location.search.includes('mode=f86') ||
      window.location.search.includes('research=f86')
    );
  });

  const [inF87Harness, setInF87Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('f87') ||
      window.location.hash.includes('f87') ||
      window.location.search.includes('mode=f87') ||
      window.location.search.includes('research=f87')
    );
  });

  const [inF88Harness, setInF88Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('f88') ||
      window.location.hash.includes('f88') ||
      window.location.search.includes('mode=f88') ||
      window.location.search.includes('research=f88')
    );
  });

  const [inF89Harness, setInF89Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('f89') ||
      window.location.hash.includes('f89') ||
      window.location.search.includes('mode=f89') ||
      window.location.search.includes('research=f89')
    );
  });

  const [inP51Harness, setInP51Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p51') ||
      window.location.hash.includes('p51') ||
      window.location.search.includes('mode=p51') ||
      window.location.search.includes('research=p51')
    );
  });

  const [inP52Harness, setInP52Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p52') ||
      window.location.hash.includes('p52') ||
      window.location.search.includes('mode=p52') ||
      window.location.search.includes('research=p52')
    );
  });

  const [inP61Harness, setInP61Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p61') ||
      window.location.hash.includes('p61') ||
      window.location.search.includes('mode=p61') ||
      window.location.search.includes('research=p61')
    );
  });

  const [inP62Harness, setInP62Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p62') ||
      window.location.hash.includes('p62') ||
      window.location.search.includes('mode=p62') ||
      window.location.search.includes('research=p62')
    );
  });

  const [inP63Harness, setInP63Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p63') ||
      window.location.hash.includes('p63') ||
      window.location.search.includes('mode=p63') ||
      window.location.search.includes('research=p63')
    );
  });

  const [inP64Harness, setInP64Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p64') ||
      window.location.hash.includes('p64') ||
      window.location.search.includes('mode=p64') ||
      window.location.search.includes('research=p64')
    );
  });

  const [inP65Harness, setInP65Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p65') ||
      window.location.hash.includes('p65') ||
      window.location.search.includes('mode=p65') ||
      window.location.search.includes('research=p65')
    );
  });

  const [inP66Harness, setInP66Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p66') ||
      window.location.hash.includes('p66') ||
      window.location.search.includes('mode=p66') ||
      window.location.search.includes('research=p66')
    );
  });

  const [inP67Harness, setInP67Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p67') ||
      window.location.hash.includes('p67') ||
      window.location.search.includes('mode=p67') ||
      window.location.search.includes('research=p67')
    );
  });

  const [inP68Harness, setInP68Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p68') ||
      window.location.hash.includes('p68') ||
      window.location.search.includes('mode=p68') ||
      window.location.search.includes('research=p68')
    );
  });

  const [inP69Harness, setInP69Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p69') ||
      window.location.hash.includes('p69') ||
      window.location.search.includes('mode=p69') ||
      window.location.search.includes('research=p69')
    );
  });

  const [inP610Harness, setInP610Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p610') ||
      window.location.hash.includes('p610') ||
      window.location.search.includes('mode=p610') ||
      window.location.search.includes('research=p610')
    );
  });

  const [inP612Harness, setInP612Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p612') ||
      window.location.hash.includes('p612') ||
      window.location.search.includes('mode=p612') ||
      window.location.search.includes('research=p612')
    );
  });

  const [inP613Harness, setInP613Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p613') ||
      window.location.hash.includes('p613') ||
      window.location.search.includes('mode=p613') ||
      window.location.search.includes('research=p613')
    );
  });

  const [inP614Harness, setInP614Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p614') ||
      window.location.hash.includes('p614') ||
      window.location.search.includes('mode=p614') ||
      window.location.search.includes('research=p614')
    );
  });

  const [inP615Harness, setInP615Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p615') ||
      window.location.hash.includes('p615') ||
      window.location.search.includes('mode=p615') ||
      window.location.search.includes('research=p615')
    );
  });

  const [inP616Harness, setInP616Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p616') ||
      window.location.hash.includes('p616') ||
      window.location.search.includes('mode=p616') ||
      window.location.search.includes('research=p616')
    );
  });

  const [inP620Harness, setInP620Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p620') ||
      window.location.hash.includes('p620') ||
      window.location.search.includes('mode=p620') ||
      window.location.search.includes('research=p620')
    );
  });

  const [inP621Harness, setInP621Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p621') ||
      window.location.hash.includes('p621') ||
      window.location.search.includes('mode=p621') ||
      window.location.search.includes('research=p621')
    );
  });

  const [inP623Harness, setInP623Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p623') ||
      window.location.hash.includes('p623') ||
      window.location.search.includes('mode=p623') ||
      window.location.search.includes('research=p623')
    );
  });

  const [inP624Harness, setInP624Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p624') ||
      window.location.hash.includes('p624') ||
      window.location.search.includes('mode=p624') ||
      window.location.search.includes('research=p624')
    );
  });

  const [inP625IHarness, setInP625IHarness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p625i') ||
      window.location.hash.includes('p625i') ||
      window.location.search.includes('mode=p625i') ||
      window.location.search.includes('research=p625i')
    );
  });

  const [inP625JHarness, setInP625JHarness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('p625j') ||
      window.location.hash.includes('p625j') ||
      window.location.search.includes('mode=p625j') ||
      window.location.search.includes('research=p625j')
    );
  });

  const [inR1Harness, setInR1Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('r1') ||
      window.location.hash.includes('r1') ||
      window.location.search.includes('mode=r1') ||
      window.location.search.includes('research=r1')
    );
  });

  const [inR2Harness, setInR2Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('r2') ||
      window.location.hash.includes('r2') ||
      window.location.search.includes('mode=r2') ||
      window.location.search.includes('research=r2')
    );
  });

  const [inR3Harness, setInR3Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('r3') ||
      window.location.hash.includes('r3') ||
      window.location.search.includes('mode=r3') ||
      window.location.search.includes('research=r3')
    );
  });

  const [inR4Harness, setInR4Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('r4') ||
      window.location.hash.includes('r4') ||
      window.location.search.includes('mode=r4') ||
      window.location.search.includes('research=r4')
    );
  });

  const [inR5Harness, setInR5Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('r5') ||
      window.location.hash.includes('r5') ||
      window.location.search.includes('mode=r5') ||
      window.location.search.includes('research=r5')
    );
  });

  const [inR6Harness, setInR6Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('r6') ||
      window.location.hash.includes('r6') ||
      window.location.search.includes('mode=r6') ||
      window.location.search.includes('research=r6')
    );
  });

  const [inR7Harness, setInR7Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('r7') ||
      window.location.hash.includes('r7') ||
      window.location.search.includes('mode=r7') ||
      window.location.search.includes('research=r7')
    );
  });

  const [inR8Harness, setInR8Harness] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('r8') ||
      window.location.hash.includes('r8') ||
      window.location.search.includes('mode=r8') ||
      window.location.search.includes('research=r8')
    );
  });

  const [inUniverseStudio, setInUniverseStudio] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('information-universe-studio') ||
      window.location.hash.includes('information-universe-studio') ||
      window.location.search.includes('studio=universe')
    );
  });

  const [inputText, setInputText] = useState<string>('HELLO WORLD');
  const [currentLevel, setCurrentLevel] = useState<MemoryLevel>(1);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<number | null>(null);
  const [hoveredCellId, setHoveredCellId] = useState<number | null>(null);
  const [customTrajectoryPath, setCustomTrajectoryPath] = useState<TrajectoryPath | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<PatternRule | null>(null);
  const [selectedOptimizerResult, setSelectedOptimizerResult] = useState<PatternOptimizationResult | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<PlanSegment | null>(null);
  const [selectedComposite, setSelectedComposite] = useState<CompositeEntry | CompositeCandidate | null>(null);
  const [hierarchyMode, setHierarchyMode] = useState<'ORIGINAL' | 'FUNNEL5' | 'FUNNEL6' | 'DIFFERENCE'>('FUNNEL6');
  const [viewportMode, setViewportMode] = useState<ViewportMode>('ORIGINAL');

  // Hierarchical Root Memory (Source of Truth for multi-block)
  const [rootMemory, setRootMemory] = useState<RootMemory>(() => {
    const initial = encodeToHierarchicalMemory('HELLO WORLD', 1, 'Initial Session');
    return initial.root;
  });

  // Single-block Grid adapter for existing components
  const [grid, setGrid] = useState<MemoryGrid3D>(() => {
    const initial = encodeToHierarchicalMemory('HELLO WORLD', 1, 'Initial Session');
    const primaryBlock = initial.root.blocks[0];
    return {
      version: '2.0.0',
      dimension: 7,
      totalCells: initial.root.totalCapacity,
      totalAddressSpace: 369,
      symbolCount: 26,
      cells: primaryBlock.cells,
      sequenceSteps: initial.steps,
      activeCellCount: initial.uniqueCellsActivated,
      entryCellId: initial.steps[0]?.cellId ?? null,
      metadata: {
        title: 'Initial Session',
        createdAt: new Date().toISOString(),
        description: 'Initial 3D Memory Session',
      },
    };
  });

  // Compute Spatial Encoding Plan dynamically from Root Memory
  const encodingPlanResult = React.useMemo(() => {
    try {
      return encodeToSpatialCompact(rootMemory);
    } catch {
      return null;
    }
  }, [rootMemory]);

  // Compute Spatial Decode Result dynamically from .compact3d Binary Artifact (Funnel 3)
  const spatialDecodeResult = React.useMemo<SpatialDecodeResult | null>(() => {
    if (!encodingPlanResult || !encodingPlanResult.binaryBuffer) return null;
    try {
      return decodeCompactBinary(encodingPlanResult.binaryBuffer, rootMemory);
    } catch (err: any) {
      console.error('Funnel 3 Decoder Error:', err);
      return null;
    }
  }, [encodingPlanResult, rootMemory]);

  // Viewport Diff Inspection Mode (Original / Decoded / Difference)
  const [viewportDiffMode, setViewportDiffMode] = useState<ViewportDiffMode>('ORIGINAL');

  // Encode & Decode Results
  const [encodeResult, setEncodeResult] = useState<EncodeResult | null>(() => {
    const initial = encodeToHierarchicalMemory('HELLO WORLD', 1, 'Initial Session');
    const primaryBlock = initial.root.blocks[0];
    const initialGrid: MemoryGrid3D = {
      version: '2.0.0',
      dimension: 7,
      totalCells: initial.root.totalCapacity,
      totalAddressSpace: 369,
      symbolCount: 26,
      cells: primaryBlock.cells,
      sequenceSteps: initial.steps,
      activeCellCount: initial.uniqueCellsActivated,
      entryCellId: initial.steps[0]?.cellId ?? null,
      metadata: {
        title: 'Initial Session',
        createdAt: new Date().toISOString(),
        description: 'Initial 3D Memory Session',
      },
    };
    return {
      success: true,
      grid: initialGrid,
      steps: initial.steps,
      textLength: 11,
      uniqueCellsActivated: initial.uniqueCellsActivated,
      encodingTimeMs: initial.encodingTimeMs,
    };
  });

  const [decodeResult, setDecodeResult] = useState<DecodeResult | null>(() => {
    const initial = encodeToHierarchicalMemory('HELLO WORLD', 1, 'Initial Session');
    return decodeHierarchicalMemory(initial.root, 'HELLO WORLD');
  });

  // UI Viewport Controls
  const [sliceAxis, setSliceAxis] = useState<'ALL' | 'X' | 'Y' | 'Z'>('ALL');
  const [sliceIndex, setSliceIndex] = useState<number>(3);
  const [showSequencePath, setShowSequencePath] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showInactive, setShowInactive] = useState<boolean>(true);

  // Active Right Panel Tab (Funnel 1..10 or Tool)
  const [activeSidebarTab, setActiveSidebarTab] = useState<StudioTab>('DISCOVERY');

  // Test Suite Modal
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState<boolean>(false);

  // Encode Handler
  const handleEncode = useCallback(
    (text: string, level: MemoryLevel) => {
      const result = encodeToHierarchicalMemory(text, level);
      setRootMemory(result.root);

      const primaryBlock = result.root.blocks[0];
      const newGrid: MemoryGrid3D = {
        version: '2.0.0',
        dimension: 7,
        totalCells: result.root.totalCapacity,
        totalAddressSpace: 369,
        symbolCount: 26,
        cells: primaryBlock.cells,
        sequenceSteps: result.steps,
        activeCellCount: result.uniqueCellsActivated,
        entryCellId: result.steps[0]?.cellId ?? null,
        metadata: {
          title: `Session ${Date.now()}`,
          createdAt: new Date().toISOString(),
          description: 'Interactive 3D Session',
        },
      };

      setGrid(newGrid);
      setEncodeResult({
        success: true,
        grid: newGrid,
        steps: result.steps,
        textLength: text.length,
        uniqueCellsActivated: result.uniqueCellsActivated,
        encodingTimeMs: result.encodingTimeMs,
      });

      // Auto decode to verify losslessness immediately
      const dec = decodeHierarchicalMemory(result.root, text);
      setDecodeResult(dec);

      // Select entry cell if available
      if (newGrid.entryCellId !== null) {
        setSelectedCellId(newGrid.entryCellId);
      }
    },
    []
  );

  // Decode Handler
  const handleDecode = useCallback(() => {
    const result = decodeHierarchicalMemory(rootMemory, inputText);
    setDecodeResult(result);
  }, [rootMemory, inputText]);

  // Reset to New Empty Grid
  const handleNewGrid = () => {
    const empty = createEmptyMemoryGrid('New Pristine Grid');
    const initial = encodeToHierarchicalMemory('', 1, 'Empty Session');
    setRootMemory(initial.root);
    setGrid(empty);
    setInputText('');
    setEncodeResult(null);
    setDecodeResult(null);
    setSelectedBlockId(null);
    setSelectedCellId(null);
    setCustomTrajectoryPath(null);
  };

  // Import Grid from File
  const handleImportGrid = (importedGrid: MemoryGrid3D) => {
    setGrid(importedGrid);
    setSelectedCellId(importedGrid.entryCellId);
    const dec = decode3DMemoryToText(importedGrid);
    setDecodeResult(dec);
    setInputText(dec.decodedText);

    // Reconstruct root memory from single grid or imported data
    const hier = encodeToHierarchicalMemory(dec.decodedText, 1, importedGrid.metadata.title);
    setRootMemory(hier.root);

    setEncodeResult({
      success: true,
      grid: importedGrid,
      steps: importedGrid.sequenceSteps,
      textLength: dec.decodedText.length,
      uniqueCellsActivated: importedGrid.activeCellCount,
      encodingTimeMs: 0,
    });
  };

  // Load grid directly from Test Suite
  const handleLoadFromTestSuite = (loadedGrid: MemoryGrid3D, text: string) => {
    setGrid(loadedGrid);
    setInputText(text);
    setSelectedCellId(loadedGrid.entryCellId);
    const hier = encodeToHierarchicalMemory(text, 1, 'Benchmark Case');
    setRootMemory(hier.root);
    const dec = decodeHierarchicalMemory(hier.root, text);
    setDecodeResult(dec);
    setEncodeResult({
      success: true,
      grid: loadedGrid,
      steps: loadedGrid.sequenceSteps,
      textLength: text.length,
      uniqueCellsActivated: loadedGrid.activeCellCount,
      encodingTimeMs: 0,
    });
  };

  // Load benchmark dataset directly into 3D Studio
  const handleLoadDatasetToStudio = useCallback((datasetRoot: RootMemory, datasetName: string) => {
    setRootMemory(datasetRoot);
    const primaryBlock = datasetRoot.blocks[0];
    const newGrid: MemoryGrid3D = {
      version: '2.0.0',
      dimension: 7,
      totalCells: datasetRoot.totalCapacity,
      totalAddressSpace: 369,
      symbolCount: 26,
      cells: primaryBlock.cells,
      sequenceSteps: datasetRoot.sequenceSteps || [],
      activeCellCount: primaryBlock.metadata?.activeCellCount ?? primaryBlock.cells.filter(c => c.state === 1).length,
      entryCellId: datasetRoot.sequenceSteps?.[0]?.cellId ?? null,
      metadata: {
        title: datasetName,
        createdAt: new Date().toISOString(),
        description: `Benchmark Dataset: ${datasetName}`,
      },
    };
    setGrid(newGrid);
    setSelectedBlockId(primaryBlock.blockId);
    if (newGrid.entryCellId !== null) {
      setSelectedCellId(newGrid.entryCellId);
    }
  }, []);

  const handleSelectBlock = (blockId: number | null) => {
    setSelectedBlockId(blockId);
  };

  const handleSelectCell = (cellId: number | null) => {
    setSelectedCellId(cellId);
  };

  const selectedCell = selectedCellId !== null ? grid.cells[selectedCellId] : null;
  const selectedBlock =
    selectedBlockId !== null
      ? rootMemory.blocks.find((b) => b.blockId === selectedBlockId) || null
      : null;

  if (inCubiOIntelligence) {
    return (
      <CubiOIntelligenceApp
        onExitToCore={() => {
          setInCubiOIntelligence(false);
          setInCubiONetwork(false);
          setInCubiOStudio(true);
        }}
        onExitToNetwork={() => {
          setInCubiOIntelligence(false);
          setInCubiONetwork(true);
        }}
      />
    );
  }

  if (inCubiONetwork) {
    return (
      <CubiONetworkApp
        onExitToCore={() => {
          setInCubiONetwork(false);
          setInCubiOIntelligence(false);
          setInCubiOStudio(true);
        }}
        onExitToIntelligence={() => {
          setInCubiONetwork(false);
          setInCubiOIntelligence(true);
        }}
      />
    );
  }

  if (inCubiOStudio) {
    return (
      <CubiOStudioApp
        onExit={() => setInCubiOStudio(false)}
        onNavigateToIntelligence={() => {
          setInCubiOStudio(false);
          setInCubiOIntelligence(true);
        }}
        onNavigateToNetwork={() => {
          setInCubiOStudio(false);
          setInCubiONetwork(true);
        }}
      />
    );
  }

  if (inF11Studio) {
    return <R11ResearchStudio onExit={() => setInF11Studio(false)} />;
  }

  if (inF10Studio) {
    return <R10RealityAIApp onExit={() => setInF10Studio(false)} />;
  }

  if (inR9Studio) {
    return <R9ResearchStudioApp onExit={() => setInR9Studio(false)} />;
  }

  if (inF83Harness) {
    return <F83ResearchHarness onExit={() => setInF83Harness(false)} />;
  }

  if (inF84Harness) {
    return <F84ResearchHarness onExit={() => setInF84Harness(false)} />;
  }

  if (inF85Harness) {
    return <F85ResearchHarness onExit={() => setInF85Harness(false)} />;
  }

  if (inF86Harness) {
    return <F86ResearchHarness onExit={() => setInF86Harness(false)} />;
  }

  if (inF87Harness) {
    return <F87ResearchHarness onExit={() => setInF87Harness(false)} />;
  }

  if (inF88Harness) {
    return <F88ResearchHarness onExit={() => setInF88Harness(false)} />;
  }

  if (inF89Harness) {
    return <F89ResearchHarness onExit={() => setInF89Harness(false)} />;
  }

  if (inP51Harness) {
    return <P51ResearchHarness onExit={() => setInP51Harness(false)} />;
  }

  if (inP52Harness) {
    return <P52ResearchHarness onExit={() => setInP52Harness(false)} />;
  }

  if (inP61Harness) {
    return <P61ResearchHarness onExit={() => setInP61Harness(false)} />;
  }

  if (inP62Harness) {
    return <P62ResearchHarness onExit={() => setInP62Harness(false)} />;
  }

  if (inP63Harness) {
    return <P63ResearchHarness onExit={() => setInP63Harness(false)} />;
  }

  if (inP64Harness) {
    return <P64ResearchHarness onExit={() => setInP64Harness(false)} />;
  }

  if (inP65Harness) {
    return <P65ResearchHarness onExit={() => setInP65Harness(false)} />;
  }

  if (inP66Harness) {
    return <P66ResearchHarness onExit={() => setInP66Harness(false)} />;
  }

  if (inP67Harness) {
    return <P67ResearchHarness onExit={() => setInP67Harness(false)} />;
  }

  if (inP68Harness) {
    return <P68ResearchHarness onExit={() => setInP68Harness(false)} />;
  }

  if (inP69Harness) {
    return <P69ResearchHarness onExit={() => setInP69Harness(false)} />;
  }

  if (inP610Harness) {
    return <P610ResearchHarness onExit={() => setInP610Harness(false)} />;
  }

  if (inP612Harness) {
    return <P612ResearchHarness onExit={() => setInP612Harness(false)} />;
  }

  if (inP613Harness) {
    return <P613ResearchHarness onExit={() => setInP613Harness(false)} />;
  }

  if (inP614Harness) {
    return <P614ResearchHarness onExit={() => setInP614Harness(false)} />;
  }

  if (inP615Harness) {
    return <P615ResearchHarness onExit={() => setInP615Harness(false)} />;
  }

  if (inP616Harness) {
    return <P616ResearchHarness onExit={() => setInP616Harness(false)} />;
  }

  if (inP620Harness) {
    return <P620ResearchHarness onExit={() => setInP620Harness(false)} />;
  }

  if (inP621Harness) {
    return <P621ResearchHarness onExit={() => setInP621Harness(false)} />;
  }

  if (inP623Harness) {
    return <P623ResearchHarness onExit={() => setInP623Harness(false)} />;
  }

  if (inP624Harness) {
    return <P624ResearchHarness onExit={() => setInP624Harness(false)} />;
  }

  if (inP625IHarness) {
    return <P625ILiveWorkspace onExit={() => setInP625IHarness(false)} />;
  }

  if (inP625JHarness) {
    return <P625JResearchHarness onExit={() => setInP625JHarness(false)} />;
  }

  if (inR1Harness) {
    return <R1ResearchHarness onExit={() => setInR1Harness(false)} />;
  }

  if (inR2Harness) {
    return <R2ResearchHarness onExit={() => setInR2Harness(false)} />;
  }

  if (inR3Harness) {
    return <R3ResearchHarness onExit={() => setInR3Harness(false)} />;
  }

  if (inR4Harness) {
    return <R4ResearchHarness onExit={() => setInR4Harness(false)} />;
  }

  if (inR5Harness) {
    return <R5ResearchHarness onExit={() => setInR5Harness(false)} />;
  }

  if (inR6Harness) {
    return <R6ResearchHarness onExit={() => setInR6Harness(false)} />;
  }

  if (inR7Harness) {
    return <R7ResearchStudioApp onExit={() => setInR7Harness(false)} />;
  }

  if (inR8Harness) {
    return <R8ResearchStudioApp onExit={() => setInR8Harness(false)} />;
  }

  if (isRuntimeActive) {
    return <StudioRuntimeApp onExit={() => setIsRuntimeActive(false)} />;
  }

  if (inUniverseStudio) {
    return <InformationUniverseStudio onExitToMemoryStudio={() => setInUniverseStudio(false)} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0A0A0B] text-[#E0E0E0] font-sans overflow-hidden antialiased select-none">
      {/* Top Application Header */}
      <Header
        grid={grid}
        rootMemory={rootMemory}
        onNewGrid={handleNewGrid}
        onImportGrid={handleImportGrid}
        onOpenTestSuite={() => setIsTestSuiteOpen(true)}
        onOpenUniverseStudio={() => setInUniverseStudio(true)}
        sliceAxis={sliceAxis}
        setSliceAxis={setSliceAxis}
        sliceIndex={sliceIndex}
        setSliceIndex={setSliceIndex}
        showSequencePath={showSequencePath}
        setShowSequencePath={setShowSequencePath}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
        showInactive={showInactive}
        setShowInactive={setShowInactive}
      />

      {/* Global Research Studio Pipeline Navigator (Funnels 1–10 + Tools) */}
      <ResearchStudioNav
        activeTab={activeSidebarTab}
        onSelectTab={setActiveSidebarTab}
      />

      {activeSidebarTab === 'FRACTAL_VSSD' ? (
        <main className="flex-1 overflow-hidden p-2">
          <FractalVSSDStudio onClose={() => setActiveSidebarTab('DISCOVERY')} />
        </main>
      ) : (
        /* Main Workspace Layout */
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 gap-3">
          {/* Left/Center: Interactive 3D Spatial Memory Viewport */}
          <section className="flex-1 flex flex-col min-w-0 min-h-[340px] relative">
          <ThreeCanvas
            grid={grid}
            rootMemory={rootMemory}
            selectedBlockId={selectedBlockId}
            onSelectBlock={handleSelectBlock}
            selectedCellId={selectedCellId}
            onSelectCell={handleSelectCell}
            hoveredCellId={hoveredCellId}
            onHoverCell={setHoveredCellId}
            sliceAxis={sliceAxis}
            sliceIndex={sliceIndex}
            showSequencePath={showSequencePath}
            showLabels={showLabels}
            showInactive={showInactive}
            customTrajectoryPath={customTrajectoryPath}
            selectedPattern={selectedPattern}
            selectedOptimizerResult={selectedOptimizerResult}
            selectedSegment={selectedSegment}
            onSelectSegment={setSelectedSegment}
            selectedComposite={selectedComposite}
            hierarchyMode={hierarchyMode}
            onHierarchyModeChange={setHierarchyMode}
            encodingPlan={encodingPlanResult?.plan}
            viewportMode={viewportMode}
            onViewportModeChange={setViewportMode}
            decodedMemory={spatialDecodeResult?.reconstructedMemory}
            comparisonResult={spatialDecodeResult?.exactComparison}
            viewportDiffMode={viewportDiffMode}
            onViewportDiffModeChange={setViewportDiffMode}
          />
        </section>

        {/* Right Dock: Multi-Functional Research Panels */}
        <aside className="w-full lg:w-[480px] xl:w-[560px] flex flex-col min-h-0 bg-[#111113] rounded border border-[#2D2D2F] shadow-2xl overflow-hidden">
          {/* Active Panel Body */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {activeSidebarTab === 'COMPACT_DECODER' && (
              <CompactDecoderPanel />
            )}

            {activeSidebarTab === 'PROFITABILITY' && (
              <CompositeProfitabilityPanel
                grid={grid}
                onSelectCandidate={(sig) => {
                  // highlight or select candidate
                }}
              />
            )}

            {activeSidebarTab === 'DISCOVERY' && (
              <CompositeDiscoveryPanel
                rootMemory={rootMemory}
                onSelectCandidate={(cand) => setSelectedComposite(cand as any)}
                onSelectCell={handleSelectCell}
                onSelectBlock={handleSelectBlock}
              />
            )}

            {activeSidebarTab === 'CANONICAL' && (
              <CanonicalSignaturePanel
                rootMemory={rootMemory}
                onSelectCell={handleSelectCell}
              />
            )}

            {activeSidebarTab === 'HIERARCHY' && (
              <SpatialHierarchyPanel
                rootMemory={rootMemory}
                selectedComposite={selectedComposite}
                onSelectComposite={setSelectedComposite}
                onLoadDatasetToStudio={handleLoadDatasetToStudio}
                hierarchyMode={hierarchyMode}
                onHierarchyModeChange={setHierarchyMode}
              />
            )}

            {activeSidebarTab === 'SPATIAL_DICT' && (
              <SpatialDictionaryPanel
                rootMemory={rootMemory}
                onSelectCell={handleSelectCell}
              />
            )}

            {activeSidebarTab === 'COMPRESSION_PROOF' && (
              <CompressionBenchmarkPanel
                onLoadDatasetToStudio={handleLoadDatasetToStudio}
              />
            )}

            {activeSidebarTab === 'SPATIAL_DECODER' && (
              <SpatialDecoderPanel
                rootMemory={rootMemory}
                binaryBuffer={encodingPlanResult?.binaryBuffer}
                decodeResult={spatialDecodeResult}
                viewportDiffMode={viewportDiffMode}
                onViewportDiffModeChange={setViewportDiffMode}
                onSelectBlock={handleSelectBlock}
                onSelectCell={handleSelectCell}
              />
            )}

            {activeSidebarTab === 'SPATIAL_ENCODER' && (
              <SpatialEncoderPanel
                rootMemory={rootMemory}
                selectedSegment={selectedSegment}
                onSelectSegment={setSelectedSegment}
                onSelectBlock={handleSelectBlock}
                onSelectCell={handleSelectCell}
                viewportMode={viewportMode}
                onViewportModeChange={setViewportMode}
              />
            )}

            {activeSidebarTab === 'OPTIMIZER' && (
              <RuleOptimizerPanel
                grid={grid}
                rootMemory={rootMemory}
                selectedOptimizationResult={selectedOptimizerResult}
                onSelectOptimizationResult={setSelectedOptimizerResult}
                onSelectBlock={handleSelectBlock}
                onSelectCell={handleSelectCell}
              />
            )}

            {activeSidebarTab === 'FUNNELS' && (
              <FunnelArchitectureView
                inputText={inputText}
                grid={grid}
                encodeResult={encodeResult}
                decodeResult={decodeResult}
                onSelectCell={handleSelectCell}
                selectedCellId={selectedCellId}
              />
            )}

            {activeSidebarTab === 'TREE' && (
              <div className="p-3">
                <MemoryTreePanel
                  rootMemory={rootMemory}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={handleSelectBlock}
                  selectedCellId={selectedCellId}
                  onSelectCell={handleSelectCell}
                />
              </div>
            )}

            {activeSidebarTab === 'PATTERNS' && (
              <SpatialPatternPanel
                grid={grid}
                rootMemory={rootMemory}
                selectedPattern={selectedPattern}
                onSelectPattern={setSelectedPattern}
                onSelectCell={handleSelectCell}
              />
            )}

            {activeSidebarTab === 'ENCODER' && (
              <EncoderDecoderPanel
                inputText={inputText}
                setInputText={setInputText}
                onEncode={handleEncode}
                onDecode={handleDecode}
                encodeResult={encodeResult}
                decodeResult={decodeResult}
                onSelectCell={handleSelectCell}
                currentLevel={currentLevel}
                setCurrentLevel={setCurrentLevel}
              />
            )}

            {activeSidebarTab === 'INSPECTOR' && (
              <InspectorPanel
                selectedCell={selectedCell}
                grid={grid}
                onSelectCell={handleSelectCell}
                selectedBlock={selectedBlock}
                rootMemory={rootMemory}
                onSelectBlock={handleSelectBlock}
              />
            )}

            {activeSidebarTab === 'RESEARCH' && (
              <ResearchModePanel
                grid={grid}
                selectedCell={selectedCell}
                onSelectCell={handleSelectCell}
                onSetTrajectory={setCustomTrajectoryPath}
              />
            )}

            {activeSidebarTab === 'METRICS' && (
              <BinaryComparisonPanel
                inputText={inputText}
                grid={grid}
                rootMemory={rootMemory}
                lossPercentage={decodeResult?.lossPercentage ?? 0}
                selectedCellId={selectedCellId}
                onSelectCell={handleSelectCell}
                selectedPattern={selectedPattern}
                onSelectPattern={setSelectedPattern}
              />
            )}

            {ENABLE_EULER_MEMORY_EXPERIMENT && activeSidebarTab === 'EULER_MEMORY' && (
              <EulerMemoryPanel memoryGrid={grid} />
            )}
          </div>
        </aside>
      </main>
      )}

      {/* Automated Test Suite Modal */}
      <TestSuiteModal
        isOpen={isTestSuiteOpen}
        onClose={() => setIsTestSuiteOpen(false)}
        onLoadGridIntoStudio={handleLoadFromTestSuite}
      />
    </div>
  );
}
