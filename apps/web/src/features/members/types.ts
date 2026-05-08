export type MemberStatus = 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'INACTIVE';

export interface MemberUser {
  id: string;
  email: string;
  status: UserStatus;
}

export interface Member {
  id: string;
  cashGroupId: string;
  userId: string | null;
  name: string;
  cpf: string | null;
  phone: string | null;
  pixKey: string | null;
  quotasCount: number;
  status: MemberStatus;
  user: MemberUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberData {
  cashGroupId: string;
  name: string;
  cpf?: string;
  phone?: string;
  pixKey?: string;
  quotasCount: number;
}

export interface UpdateMemberData {
  name?: string;
  cpf?: string;
  phone?: string;
  pixKey?: string;
  quotasCount?: number;
  status?: MemberStatus;
}
