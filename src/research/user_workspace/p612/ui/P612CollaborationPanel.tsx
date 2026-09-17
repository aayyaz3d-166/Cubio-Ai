/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.12: Space Sharing Controls Panel
 */

import React, { useState } from 'react';
import { SpaceShare, AccessLevel, WorkspaceMember } from '../types';
import { Share2, UserPlus, ShieldAlert, ShieldCheck } from 'lucide-react';

interface P612CollaborationPanelProps {
  share: SpaceShare;
  currentUser: WorkspaceMember;
  onInviteMember: (userId: string, userName: string, accessLevel: AccessLevel) => void;
  onRevokeShare: () => void;
}

export const P612CollaborationPanel: React.FC<P612CollaborationPanelProps> = ({
  share,
  currentUser,
  onInviteMember,
  onRevokeShare,
}) => {
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteUserName, setInviteUserName] = useState('');
  const [inviteRole, setInviteRole] = useState<AccessLevel>('OBSERVER');

  const isOwner = currentUser.accessLevel === 'OWNER';
  const isRevoked = share.status === 'REVOKED';

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUserId.trim() || !inviteUserName.trim()) return;
    onInviteMember(inviteUserId.trim(), inviteUserName.trim(), inviteRole);
    setInviteUserId('');
    setInviteUserName('');
  };

  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5" /> SPACE SHARING
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
            isRevoked ? 'bg-red-950/60 text-red-400 border border-red-800' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
          }`}
        >
          {share.status}
        </span>
      </div>

      <div className="p-2 rounded bg-black/40 border border-zinc-800 space-y-1 text-[8.5px]">
        <div className="flex justify-between">
          <span className="text-zinc-500">Share ID:</span>
          <span className="text-zinc-300 font-mono">{share.shareId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Identity:</span>
          <span className="text-cyan-400 font-mono">{share.shareIdentity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Owner:</span>
          <span className="text-amber-400 font-bold">{share.ownerUserId}</span>
        </div>
      </div>

      {isOwner && !isRevoked && (
        <form onSubmit={handleInvite} className="space-y-2 pt-1 border-t border-zinc-800/80">
          <div className="text-[8.5px] font-bold text-zinc-400 flex items-center gap-1">
            <UserPlus className="w-3 h-3 text-cyan-400" /> Invite Collaborator
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <input
              type="text"
              placeholder="User ID (e.g. USR_02)"
              value={inviteUserId}
              onChange={(e) => setInviteUserId(e.target.value)}
              className="px-2 py-1 bg-black/50 border border-zinc-800 rounded text-zinc-200 text-[8px] focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              placeholder="Name"
              value={inviteUserName}
              onChange={(e) => setInviteUserName(e.target.value)}
              className="px-2 py-1 bg-black/50 border border-zinc-800 rounded text-zinc-200 text-[8px] focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AccessLevel)}
              className="px-2 py-1 bg-black/60 border border-zinc-800 rounded text-zinc-300 text-[8px] focus:outline-none focus:border-cyan-500"
            >
              <option value="OBSERVER">OBSERVER (Read-Only)</option>
              <option value="EDITOR">EDITOR (Modify Permitted State)</option>
            </select>
            <button
              type="submit"
              className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 rounded border border-cyan-500/40 text-[8px] font-bold cursor-pointer transition-colors"
            >
              Invite
            </button>
          </div>
        </form>
      )}

      {isOwner && !isRevoked && (
        <div className="pt-2 border-t border-zinc-800/80 flex justify-end">
          <button
            onClick={onRevokeShare}
            className="px-2 py-1 bg-red-950/40 hover:bg-red-950/70 text-red-300 rounded border border-red-800/60 text-[8px] font-bold cursor-pointer transition-colors"
          >
            Revoke Share Access
          </button>
        </div>
      )}
    </div>
  );
};
