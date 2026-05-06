export type MemberStatus = 'ACTIVE' | 'BLOCKED' | 'INACTIVE';

export interface Member {
  id: string;
  cashGroupId: string;
  name: string;
  phone: string | null;
  pixKey: string | null;
  quotasCount: number;
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberData {
  cashGroupId: string;
  name: string;
  phone?: string;
  pixKey?: string;
  quotasCount: number;
}

export interface UpdateMemberData {
  name?: string;
  phone?: string;
  pixKey?: string;
  quotasCount?: number;
  status?: MemberStatus;
}
