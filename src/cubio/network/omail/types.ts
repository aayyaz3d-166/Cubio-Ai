/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-07: OMail Email Network (Types & Models)
 *
 * Formal specification for sovereign email mailboxes, messages, threads,
 * delivery states, attachments, folders, and anti-spoofing security.
 *
 * ARCHITECTURAL INVARIANT:
 * - OMail operates as a sovereign communication service layered on top of NET-05 messaging.
 * - Sender identity is strictly bound to authenticated CUB-XXXXXXXX (NET-01/NET-02).
 * - Sender address must be owned by the caller in CubiOAddressRegistry (Anti-Spoofing).
 * - Large mail attachments are content-addressed in NET-06 Storage.
 * - CNC Mail Coordinate: CUBIO://NETWORK/0/01/00002/MAIL.
 */

export type OMailDeliveryStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'READ'
  | 'ARCHIVED'
  | 'TRASHED';

export type OMailFolderType =
  | 'INBOX'
  | 'SENT'
  | 'DRAFTS'
  | 'STARRED'
  | 'ARCHIVE'
  | 'TRASH'
  | 'SPAM';

export type OMailContentType = 'text/plain' | 'text/html' | 'text/markdown';

export interface OMailAttachment {
  readonly attachmentId: string; // ATT_...
  readonly name: string;
  readonly sizeBytes: number;
  readonly mimeType: string;
  readonly storageObjectId?: string; // NET-06 StorageObject ID (CAS block tree)
  readonly storageCoordinate?: string; // e.g. CUBIO://NETWORK/0/01/00004/STORAGE
  readonly rawContent?: Uint8Array | string;
}

export interface OMailFlags {
  readonly isRead: boolean;
  readonly isStarred: boolean;
  readonly isArchived: boolean;
  readonly isSpam: boolean;
  readonly isDraft: boolean;
}

export interface OMailMessage {
  readonly mailId: string; // MAIL_...
  readonly threadId: string; // THRD_...
  readonly ownerCubId: string; // Sovereign identity holding this copy in their mailbox
  readonly folder: OMailFolderType;
  readonly senderCubId: string; // Authoritative CUB-XXXXXXXX
  readonly senderAddress: string; // verified username@omail.com or username@cubio.com
  readonly recipientAddresses: readonly string[];
  readonly recipientCubIds: readonly string[];
  readonly ccAddresses?: readonly string[];
  readonly bccAddresses?: readonly string[];
  readonly subject: string;
  readonly body: string;
  readonly contentType: OMailContentType;
  readonly attachments: readonly OMailAttachment[];
  readonly status: OMailDeliveryStatus;
  readonly flags: OMailFlags;
  readonly inReplyToMailId?: string;
  readonly coordinateUri: string; // Standard CUBIO://NETWORK/0/01/00002/MAIL
  readonly net05MessageId?: string; // Underlying NET-05 P2P message ID
  readonly sentAt?: number;
  readonly deliveredAt?: number;
  readonly readAt?: number;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly metadata?: Readonly<Record<string, any>>;
}

export interface OMailThread {
  readonly threadId: string; // THRD_...
  readonly ownerCubId: string;
  readonly subject: string;
  readonly participantAddresses: readonly string[];
  readonly participantCubIds: readonly string[];
  readonly messageCount: number;
  readonly lastMessageId: string;
  readonly lastMessageSnippet: string;
  readonly lastActivityAt: number;
  readonly isUnread: boolean;
}

export interface FolderSummary {
  readonly count: number;
  readonly unreadCount: number;
}

export interface OMailBox {
  readonly mailboxId: string; // MBX_...
  readonly ownerCubId: string; // Sovereign CUB-XXXXXXXX
  readonly primaryAddress: string; // primary @omail.com or @cubio.com
  readonly folders: Readonly<Record<OMailFolderType, FolderSummary>>;
  readonly unreadCount: number;
  readonly totalMessageCount: number;
  readonly quotaBytes: number;
  readonly usedBytes: number;
  readonly coordinateUri: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface SendMailInput {
  readonly senderAddress?: string; // Optional: if omitted, primary owned address is used
  readonly to: readonly string[]; // Recipient addresses (@omail.com, @cubio.com, or CUB-ID)
  readonly cc?: readonly string[];
  readonly bcc?: readonly string[];
  readonly subject: string;
  readonly body: string;
  readonly contentType?: OMailContentType;
  readonly inReplyToMailId?: string;
  readonly threadId?: string;
  readonly attachments?: readonly {
    name: string;
    data: Uint8Array | string;
    mimeType?: string;
  }[];
  readonly metadata?: Record<string, any>;
}

export interface SaveDraftInput {
  readonly draftId?: string;
  readonly senderAddress?: string;
  readonly to?: readonly string[];
  readonly cc?: readonly string[];
  readonly bcc?: readonly string[];
  readonly subject?: string;
  readonly body?: string;
  readonly contentType?: OMailContentType;
  readonly inReplyToMailId?: string;
  readonly threadId?: string;
  readonly attachments?: readonly {
    name: string;
    data: Uint8Array | string;
    mimeType?: string;
  }[];
  readonly metadata?: Record<string, any>;
}

export interface MailQueryOptions {
  readonly folder?: OMailFolderType;
  readonly threadId?: string;
  readonly isUnread?: boolean;
  readonly isStarred?: boolean;
  readonly limit?: number;
  readonly offset?: number;
  readonly searchQuery?: string;
}

export interface OMailThreadView {
  readonly thread: OMailThread;
  readonly messages: readonly OMailMessage[];
}
