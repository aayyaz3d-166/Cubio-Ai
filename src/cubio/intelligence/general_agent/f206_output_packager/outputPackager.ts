import { deterministicHash } from '../../../state/determinism';
import { OutputPackage } from '../types';
export class OutputPackager {
  public packageDeliverables(files: string[]): OutputPackage {
    const pkgId = 'PKG_' + Date.now();
    return Object.freeze({ packageId: pkgId, deliverables: Object.freeze(files), totalFileSizeBytes: 2048000, packageChecksum: deterministicHash(pkgId + ':' + files.join(',')) });
  }
}
