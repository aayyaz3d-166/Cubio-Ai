/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F58: Master Native 369 Intelligence Engine
 *
 * Implements the HARMONIC_369 universal capability behind the Router.
 * Enforces dual-layer epistemic separation: Verified Mathematics vs. Experimental Harmonics.
 */

import { deterministicHash } from '../../../state/determinism';
import { ProviderInfo, ProviderStatus } from '../universalTypes';
import { INative369Engine, Native369Report } from './types';
import { VerifiedMathSolver } from './solvers/verifiedMathSolver';
import { ExperimentalHarmonicsSolver } from './solvers/experimentalHarmonicsSolver';
import { EpistemicBoundaryAuditor } from './solvers/epistemicAuditor';
import { CubiOProviderRegistry } from '../providerRegistry';

export class CubiONative369IntelligenceEngine implements INative369Engine {
  public readonly providerId = 'cubio-native-369-engine-v1';
  public readonly providerName = 'CubiO Native 369 Intelligence Engine';

  private mathSolver = new VerifiedMathSolver();
  private harmonicsSolver = new ExperimentalHarmonicsSolver();
  private auditor = new EpistemicBoundaryAuditor();

  constructor(providerRegistry?: CubiOProviderRegistry) {
    if (providerRegistry) {
      providerRegistry.registerProvider(this as any);
    }
  }

  public getInfo(): ProviderInfo {
    return Object.freeze({
      providerId: this.providerId,
      providerType: 'TOOL',
      name: this.providerName,
      version: '1.0.0-369',
      status: 'AVAILABLE',
      supportedCapabilities: [
        'HARMONIC_369',
        'MATHEMATICAL_REASONING',
      ] as const,
    });
  }

  public getStatus(): ProviderStatus {
    return 'AVAILABLE';
  }

  /**
   * Computes 369 intelligence with strict dual-layer epistemic segregation.
   */
  public async compute369(
    promptOrNumber: string | number
  ): Promise<Readonly<Native369Report>> {
    const num =
      typeof promptOrNumber === 'number'
        ? promptOrNumber
        : this.extractNumberFromPrompt(promptOrNumber);

    const query = typeof promptOrNumber === 'string' ? promptOrNumber : `Harmonic 369 compute for ${num}`;
    const requestId = `REQ_369_${deterministicHash(`${query}:${num}`).slice(2, 10)}`;

    // Layer 1: Rigorous Verified Mathematics
    const verifiedMathematics = this.mathSolver.solveVerifiedMath(num);

    // Layer 2: Experimental Heuristic Harmonics
    const experimentalHarmonics = this.harmonicsSolver.solveExperimentalHarmonics(
      verifiedMathematics.digitalRoot
    );

    // Layer 3: Automated Epistemic Boundary Audit
    const epistemicBoundaryAudit = this.auditor.auditReport(
      verifiedMathematics,
      experimentalHarmonics
    );

    const reportChecksum = deterministicHash(
      `369_REPORT:${requestId}:${verifiedMathematics.digitalRoot}:${experimentalHarmonics.solfeggioCarrierHz}:${epistemicBoundaryAudit.epistemicIntegrityPassed}`
    );

    return Object.freeze({
      requestId,
      query,
      verifiedMathematics,
      experimentalHarmonics,
      epistemicBoundaryAudit,
      providerId: this.providerId,
      reportChecksum,
      timestamp: Date.now(),
    });
  }

  private extractNumberFromPrompt(prompt: string): number {
    const matches = prompt.match(/\d+/g);
    if (!matches || matches.length === 0) return 432;
    return parseInt(matches[matches.length - 1], 10);
  }
}
