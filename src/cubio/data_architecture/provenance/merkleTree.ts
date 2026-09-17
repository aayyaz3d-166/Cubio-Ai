import { deterministicHash } from '../../state/determinism';

export class MerkleTreeEngine {
  public computeMerkleRoot(leafHashes: readonly string[]): string {
    if (leafHashes.length === 0) return deterministicHash('EMPTY_MERKLE_TREE');
    if (leafHashes.length === 1) return leafHashes[0];

    let currentLevel = [...leafHashes];
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          nextLevel.push(deterministicHash('BRANCH:' + currentLevel[i] + ':' + currentLevel[i + 1]));
        } else {
          nextLevel.push(deterministicHash('BRANCH:' + currentLevel[i] + ':' + currentLevel[i]));
        }
      }
      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }
}
