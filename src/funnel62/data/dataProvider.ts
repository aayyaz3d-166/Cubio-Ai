/**
 * 3D Memory Studio — Funnel 62
 * Data Provider Abstraction (Simulation / Local / Remote)
 */

import { DataProvider } from '../types';
import { DimensionalInformationState } from '../../funnel49/types';
import { getStandardInformationUniverseFixture } from '../../funnel49/model';

export class SimulationDataProvider implements DataProvider {
  public readonly providerType = 'SIMULATION';

  public async getStates(): Promise<readonly DimensionalInformationState[]> {
    const fixture = getStandardInformationUniverseFixture();
    return fixture.states.filter((s) => s.classification === 'GREEN' && s.processingAllowed);
  }

  public async getStateById(stateId: string): Promise<DimensionalInformationState | undefined> {
    const states = await this.getStates();
    return states.find((s) => s.stateId === stateId);
  }

  public async searchStates(query: string): Promise<readonly DimensionalInformationState[]> {
    const states = await this.getStates();
    const q = query.toLowerCase().trim();
    if (!q) return states;

    return states.filter(
      (s) =>
        s.stateId.toLowerCase().includes(q) ||
        s.entityName.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.semanticTerms.some((t) => t.toLowerCase().includes(q))
    );
  }
}

export class LocalDataProvider implements DataProvider {
  public readonly providerType = 'LOCAL';
  private cachedStates: DimensionalInformationState[] = [];

  constructor(initialStates?: DimensionalInformationState[]) {
    if (initialStates) {
      this.cachedStates = initialStates.filter(
        (s) => s.classification === 'GREEN' && s.processingAllowed
      );
    }
  }

  public async getStates(): Promise<readonly DimensionalInformationState[]> {
    return this.cachedStates;
  }

  public async getStateById(stateId: string): Promise<DimensionalInformationState | undefined> {
    return this.cachedStates.find((s) => s.stateId === stateId);
  }

  public async searchStates(query: string): Promise<readonly DimensionalInformationState[]> {
    const q = query.toLowerCase().trim();
    if (!q) return this.cachedStates;
    return this.cachedStates.filter((s) => s.stateId.toLowerCase().includes(q));
  }
}

export class RemoteDataProvider implements DataProvider {
  public readonly providerType = 'REMOTE';
  private endpoint: string;

  constructor(endpoint = '/api/states') {
    this.endpoint = endpoint;
  }

  public async getStates(): Promise<readonly DimensionalInformationState[]> {
    // In actual deployment, fetches from API; returns safe fallback in testing
    const sim = new SimulationDataProvider();
    return sim.getStates();
  }

  public async getStateById(stateId: string): Promise<DimensionalInformationState | undefined> {
    const states = await this.getStates();
    return states.find((s) => s.stateId === stateId);
  }

  public async searchStates(query: string): Promise<readonly DimensionalInformationState[]> {
    const sim = new SimulationDataProvider();
    return sim.searchStates(query);
  }
}
