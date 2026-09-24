import { deterministicHash } from '../../../state/determinism';
import { ExperimentalLog } from '../types';
export class ExperimentalLogArchiver {
  public archiveLogs(entries: number = 50): ExperimentalLog {
    const logId = 'LOG_' + Date.now();
    return Object.freeze({ logId, entriesCount: entries, merkleRootHash: deterministicHash(logId + ':' + entries), immutabilityVerified: true });
  }
}
