export type MemberStatus = 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'INACTIVE';

export interface MemberUser {
  id: string;
  email: string;
  status: UserStatus;
}

export interface PendingProfileChangeRequest {
  id: string;
  createdAt: string;
}

export interface Member {
  id: string;
  cashGroupId: string;
  userId: string | null;
  name: string;
  cpf: string | null;
  phone: string | null;
  pixKey: string | null;
  bankInstitution: string | null;
  bankAccountHolder: string | null;
  quotasCount: number;
  status: MemberStatus;
  user: MemberUser | null;
  profileChangeRequests?: PendingProfileChangeRequest[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberData {
  cashGroupId: string;
  name: string;
  cpf?: string;
  phone?: string;
  pixKey?: string;
  bankInstitution?: string;
  bankAccountHolder?: string;
  quotasCount: number;
}

export interface UpdateMemberData {
  name?: string;
  cpf?: string;
  phone?: string;
  pixKey?: string;
  bankInstitution?: string;
  bankAccountHolder?: string;
  quotasCount?: number;
  status?: MemberStatus;
}

export interface ProfileChangeRequest {
  id: string;
  memberId: string;
  requestedData: {
    name?: string;
    cpf?: string;
    phone?: string;
    pixKey?: string;
    bankInstitution?: string;
    bankAccountHolder?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  member: {
    id: string;
    name: string;
    cashGroupId: string;
    cashGroup: { id: string; name: string };
  };
}
