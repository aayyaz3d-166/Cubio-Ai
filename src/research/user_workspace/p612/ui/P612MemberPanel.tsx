/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.12: Workspace Members & Permissions Panel
 */

import React from 'react';
import { SpaceShare, WorkspaceMember, AccessLevel } from '../types';
import { Users, UserX, Shield } from 'lucide-react';

interface P612MemberPanelProps {
  share: SpaceShare;
  currentUser: WorkspaceMember;
  onUpdateRole: (memberId: string, newAccess: AccessLevel) => void;
  onRemoveMember: (memberId: string) => void;
}

export const P612MemberPanel: React.FC<P612MemberPanelProps> = ({
  share,
  currentUser,
  onUpdateRole,
  onRemoveMember,
}) => {
  const isOwner = currentUser.accessLevel === 'OWNER';

  return (
    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 font-mono text-[10px] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-cyan-400 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> MEMBERS ({share.members.length})
        </span>
      </div>

      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
        {share.members.map((member) => {
          const isMemberOwner = member.accessLevel === 'OWNER';

          return (
            <div
              key={member.memberId}
              className="p-2 rounded bg-black/40 border border-zinc-800 flex items-center justify-between text-[8.5px]"
            >
              <div className="flex-1 truncate mr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-zinc-200 truncate">{member.userName}</span>
                  <span
                    className={`px-1 py-0.2 rounded text-[7px] font-bold ${
                      member.accessLevel === 'OWNER'
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                        : member.accessLevel === 'EDITOR'
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800'
                        : member.accessLevel === 'OBSERVER'
                        ? 'bg-zinc-800 text-zinc-300'
                        : 'bg-red-950/60 text-red-400'
                    }`}
                  >
                    {member.accessLevel}
                  </span>
                </div>
                <div className="text-[7.5px] text-zinc-500 truncate mt-0.5">
                  ID: {member.userId} | MBR: {member.memberId}
                </div>
              </div>

              {isOwner && !isMemberOwner && share.status !== 'REVOKED' && (
                <div className="flex items-center gap-1">
                  <select
                    value={member.accessLevel}
                    onChange={(e) => onUpdateRole(member.memberId, e.target.value as AccessLevel)}
                    className="px-1 py-0.5 bg-black/70 border border-zinc-800 rounded text-zinc-300 text-[7.5px] focus:outline-none"
                  >
                    <option value="OBSERVER">OBSERVER</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="NO_ACCESS">NO_ACCESS</option>
                  </select>
                  <button
                    onClick={() => onRemoveMember(member.memberId)}
                    title="Remove Member"
                    className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                  >
                    <UserX className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
