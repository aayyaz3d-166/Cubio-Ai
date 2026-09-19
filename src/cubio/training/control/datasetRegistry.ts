/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 47: Control Plane Dataset Registry
 *
 * Tracks registered datasets, dataset versions, modality coverage,
 * and immutable CAS manifests.
 */

import {
  RegisteredDatasetEntry,
} from './types';
import { ModalityType } from '../../multimodal/types';
import { deterministicHash } from '../../state/determinism';

export class ControlDatasetRegistry {
  private datasets: Map<string, RegisteredDatasetEntry> = new Map();

  /**
   * Registers a dataset with initial version.
   */
  public registerDataset(
    datasetName: string,
    versionTag: string,
    totalSamples: number,
    supportedModalities: readonly ModalityType[] = ['TEXT', 'IMAGE', 'AUDIO', 'THREED']
  ): RegisteredDatasetEntry {
    const existing = this.datasets.get(datasetName);
    const versions = existing ? Array.from(new Set([...existing.versions, versionTag])) : [versionTag];
    const dHash = deterministicHash(`DATASET_REG:${datasetName}:${versionTag}:${totalSamples}`);
    const casManifestCid = `bafk_data_reg_${dHash.slice(2, 10)}`;

    const entry: RegisteredDatasetEntry = Object.freeze({
      datasetName,
      versions: Object.freeze(versions),
      totalSamples,
      supportedModalities: Object.freeze([...supportedModalities]),
      casManifestCid,
      registeredTimestamp: Date.now(),
    });

    this.datasets.set(datasetName, entry);
    return entry;
  }

  public getDataset(datasetName: string): RegisteredDatasetEntry | undefined {
    return this.datasets.get(datasetName);
  }

  public getAllDatasets(): readonly RegisteredDatasetEntry[] {
    return Object.freeze(Array.from(this.datasets.values()));
  }

  public reset(): void {
    this.datasets.clear();
  }
}
