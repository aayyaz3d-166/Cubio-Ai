/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.12: Collaboration & Sharing Research Harness Dashboard
 */

import React, { useState, useMemo, useReducer } from 'react';
import { SpaceManager } from '../../p68/spaceManager';
import { PersonalSpace } from '../../p68/types';
import { P68SpaceEditor } from '../../p68/ui/P68SpaceEditor';
import { SharingEngine } from '../sharing';
import { MemberManager } from '../memberManager';
import { SharedStateEngine } from '../sharedState';
import { CollaborationHistoryLogger } from '../collaborationHistory';
import { CollaborationValidator } from '../collaborationValidator';
import {
  SpaceShare,
  WorkspaceMember,
  AccessLevel,
} from '../types';
import { P612CollaborationPanel } from './P612CollaborationPanel';
import { P612MemberPanel } from './P612MemberPanel';
import { P612SharedStatePanel } from './P612SharedStatePanel';
import { P612AuditPanel } from './P612AuditPanel';
import { Users2 } from 'lucide-react';

export const P612ResearchHarness: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const ownerUserId = 'Dr. Alice Chen (OWNER)';
  const ownerUserName = 'Alice';

  const { spaceManager, space, initialShare, historyLogger } = useMemo(() => {
    const sMgr = new SpaceManager();
    const sp = sMgr.createSpace(ownerUserId, 'Collaboration Lab Space', 'Shared Research Workspace');
    const { share, event } = SharingEngine.createShare(sp, ownerUserId, ownerUserName);
    const logger = new CollaborationHistoryLogger();
    logger.logEvent(event);

    return {
      spaceManager: sMgr,
      space: sp,
      initialShare: share,
      historyLogger: logger,
    };
  }, [ownerUserId, ownerUserName]);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const [share, setShare] = useState<SpaceShare>(initialShare);

  const currentUser: WorkspaceMember = useMemo(() => {
    const found = share.members.find((m) => m.userId === ownerUserId);
    return found || share.members[0];
  }, [share, ownerUserId]);

  // Shared State
  const sharedState = useMemo(() => {
    try {
      return SharedStateEngine.extractSharedState(share, space, currentUser);
    } catch {
      return null;
    }
  }, [share, space, currentUser]);

  // Validation Report
  const validationReport = useMemo(() => {
    return CollaborationValidator.validateShare(share);
  }, [share]);

  // ── Actions ──
  const handleInviteMember = (userId: string, userName: string, accessLevel: AccessLevel) => {
    try {
      const { share: updatedShare, event } = MemberManager.addMember(
        share,
        userId,
        userName,
        accessLevel,
        currentUser
      );
      historyLogger.logEvent(event);
      setShare(updatedShare);
      forceUpdate();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleUpdateRole = (memberId: string, newAccess: AccessLevel) => {
    try {
      const { share: updatedShare, event } = MemberManager.updateAccess(
        share,
        memberId,
        newAccess,
        currentUser
      );
      historyLogger.logEvent(event);
      setShare(updatedShare);
      forceUpdate();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    try {
      const { share: updatedShare, event } = MemberManager.removeMember(
        share,
        memberId,
        currentUser
      );
      historyLogger.logEvent(event);
      setShare(updatedShare);
      forceUpdate();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleRevokeShare = () => {
    try {
      const { share: updatedShare, event } = SharingEngine.revokeShare(share, currentUser);
      historyLogger.logEvent(event);
      setShare(updatedShare);
      forceUpdate();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050507] text-[#E0E0E0] font-mono overflow-hidden select-none">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Users2 className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-cyan-400">
            P6.12 — USER WORKSPACE COLLABORATION & SHARING
          </span>
          <span className="text-xs text-zinc-500">Phase 6: Isolated Research Collaboration Layer</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {onExit && (
            <button
              onClick={onExit}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded border border-zinc-700 hover:border-zinc-500 cursor-pointer"
            >
              EXIT
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN 3-PANEL BODY ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: SHARING CONTROLS & MEMBERS */}
        <div className="w-[340px] flex-shrink-0 border-r border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90 space-y-3">
          <P612CollaborationPanel
            share={share}
            currentUser={currentUser}
            onInviteMember={handleInviteMember}
            onRevokeShare={handleRevokeShare}
          />
          <P612MemberPanel
            share={share}
            currentUser={currentUser}
            onUpdateRole={handleUpdateRole}
            onRemoveMember={handleRemoveMember}
          />
        </div>

        {/* CENTER: 3D VIEWPORT CANVAS */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 gap-2 overflow-hidden bg-black/30">
          <P68SpaceEditor space={space} width={560} height={360} />
          <div className="text-[8.5px] text-zinc-500 font-mono">
            Shared Space: <strong className="text-cyan-400">{space.name}</strong> ({space.spaceId}) | Reality CS: {space.reality.realityChecksum}
          </div>
        </div>

        {/* RIGHT: SHARED STATE & PRIVACY */}
        <div className="w-[320px] flex-shrink-0 border-l border-zinc-800 p-3 overflow-y-auto bg-[#070709]/90 space-y-3">
          <P612SharedStatePanel sharedState={sharedState} />
        </div>
      </div>

      {/* ── BOTTOM PANEL: AUDIT & CAUSALITY ── */}
      <P612AuditPanel
        events={historyLogger.getEvents(share.shareId)}
        validationReport={validationReport}
      />
    </div>
  );
};
