import type { UserStatus } from '../auth/types';

export interface MemberAccessUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
}

export interface CreateAccessResult {
  user: MemberAccessUser;
  member: { id: string; name: string };
  temporaryPassword: string;
  message: string;
}

export interface AccessStatus {
  hasAccess: boolean;
  user: (MemberAccessUser & { createdAt: string }) | null;
  member: { id: string; name: string };
}
