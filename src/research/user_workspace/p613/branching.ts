/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.13: Workspace Branching Engine
 *
 * Facilitates controlled non-linear version branching with preserved parent ancestry.
 */

import { PersonalSpace } from '../p68/types';
import { WorkspaceVersion, BranchResult } from './types';
import { VersionManager } from './versionManager';
import { generateDeterministicBranchId } from './determinism';

export class BranchingEngine {
  public static createBranch(
    parentVersion: WorkspaceVersion,
    branchName: string,
    space: PersonalSpace,
    versionManager: VersionManager
  ): BranchResult {
    const branchWorkspaceId = generateDeterministicBranchId(
      parentVersion.workspaceId,
      parentVersion.versionId,
      branchName
    );

    const { version: branchVersion } = versionManager.createVersion(
      space,
      'BRANCH',
      parentVersion.versionId,
      `Created branch '${branchName}' from ${parentVersion.versionId}`,
      branchWorkspaceId,
      true
    );

    const result: BranchResult = Object.freeze({
      success: true,
      branchName,
      branchVersion: Object.freeze({
        ...branchVersion,
        isBranchHead: true,
        branchName,
      }),
      parentVersionId: parentVersion.versionId,
    });

    return result;
  }
}
