export type CommunicationChannel = 'INTERNAL' | 'WHATSAPP' | 'SMS' | 'EMAIL';
export type CommunicationDirection =
  | 'ADMIN_TO_MEMBER'
  | 'MEMBER_TO_ADMIN'
  | 'SYSTEM_TO_ADMIN'
  | 'SYSTEM_TO_MEMBER';

export interface CommunicationMessage {
  id: string;
  senderUserId: string | null;
  recipientUserId: string;
  cashGroupId: string | null;
  memberId: string | null;
  direction: CommunicationDirection;
  channel: CommunicationChannel;
  title: string;
  body: string;
  eventType: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface InboxResponse {
  messages: CommunicationMessage[];
  total: number;
  unread: number;
  page: number;
  limit: number;
}

export interface UnreadCountResponse {
  count: number;
}
