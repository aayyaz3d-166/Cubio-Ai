/**
 * 3D Memory Studio — Reality Integration Phase
 * Funnel F10: Determinism & Hash Utilities (σ² = 0)
 *
 * Implements deterministic hash generation and reproducible ID creation.
 */

export function deterministicHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xffffffff;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateDeterministicCommandId(sessionId: string, seq: number): string {
  const hash = deterministicHash(`CMD_${sessionId}_${seq}`);
  return `CMD_F10_${hash}`;
}

export function generateDeterministicPlanId(commandId: string, intent: string): string {
  const hash = deterministicHash(`PLAN_${commandId}_${intent}`);
  return `PLAN_F10_${hash}`;
}

export function generateDeterministicMessageId(sessionId: string, seq: number): string {
  const hash = deterministicHash(`MSG_${sessionId}_${seq}`);
  return `MSG_F10_${hash}`;
}

export function generateDeterministicContextId(commandId: string, target: string): string {
  const hash = deterministicHash(`CTX_${commandId}_${target}`);
  return `CTX_F10_${hash}`;
}

export function generateDeterministicCausalityId(commandId: string, seq: number): string {
  const hash = deterministicHash(`CAUS_F10_${commandId}_${seq}`);
  return `CAUS_F10_${hash}`;
}

export function generateDeterministicSnapshotId(sessionId: string, seq: number): string {
  const hash = deterministicHash(`SNAP_F10_${sessionId}_${seq}`);
  return `SNAP_F10_${hash}`;
}

export function computePlanChecksum(
  commandId: string,
  intent: string,
  targetIds: readonly string[],
  opsCount: number
): string {
  const payload = `PLAN:${commandId}:${intent}:${targetIds.join(',')}:${opsCount}`;
  return `CS_PLAN_${deterministicHash(payload)}`;
}

export function computeConversationChecksum(messagesCount: number, lastMessageId: string): string {
  const payload = `CONV:${messagesCount}:${lastMessageId}`;
  return `CS_CONV_${deterministicHash(payload)}`;
}

export function computeF10SessionChecksum(
  sessionId: string,
  historyCount: number,
  realityChecksum: string,
  workspaceChecksum: string
): string {
  const payload = `F10SESS:${sessionId}:${historyCount}:${realityChecksum}:${workspaceChecksum}`;
  return `CS_F10_SESS_${deterministicHash(payload)}`;
}
