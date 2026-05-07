import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

function generateTemporaryPassword(): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

@Injectable()
export class MemberAccessService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertGestorOwnsMember(
    gestorUserId: string,
    groupId: string,
    memberId: string,
  ) {
    const group = await this.prisma.cashGroup.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Caixinha não encontrada');
    if (group.ownerUserId !== gestorUserId)
      throw new ForbiddenException('Acesso negado a esta caixinha');

    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });
    if (!member || member.cashGroupId !== groupId)
      throw new NotFoundException(
        'Cotista não encontrado nesta caixinha',
      );

    return { group, member };
  }

  async createAccess(
    gestorUserId: string,
    groupId: string,
    memberId: string,
    email: string,
  ) {
    const { member } = await this.assertGestorOwnsMember(
      gestorUserId,
      groupId,
      memberId,
    );

    if (member.userId) {
      throw new BadRequestException(
        'Este cotista já possui acesso criado',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Email já está em uso');
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        name: member.name,
        email,
        passwordHash,
        role: 'COTISTA',
        status: 'ACTIVE',
      },
    });

    await this.prisma.member.update({
      where: { id: memberId },
      data: { userId: user.id },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      member: { id: member.id, name: member.name },
      temporaryPassword,
      message: 'A senha provisória será exibida apenas uma vez.',
    };
  }

  async getAccess(
    gestorUserId: string,
    groupId: string,
    memberId: string,
  ) {
    const { member } = await this.assertGestorOwnsMember(
      gestorUserId,
      groupId,
      memberId,
    );

    if (!member.userId) {
      return {
        hasAccess: false,
        user: null,
        member: { id: member.id, name: member.name },
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: member.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      hasAccess: true,
      user,
      member: { id: member.id, name: member.name },
    };
  }

  async blockAccess(
    gestorUserId: string,
    groupId: string,
    memberId: string,
  ) {
    const { member } = await this.assertGestorOwnsMember(
      gestorUserId,
      groupId,
      memberId,
    );
    if (!member.userId)
      throw new BadRequestException(
        'Este cotista não possui acesso criado',
      );

    const user = await this.prisma.user.update({
      where: { id: member.userId },
      data: { status: 'BLOCKED' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return { user, member: { id: member.id, name: member.name } };
  }

  async activateAccess(
    gestorUserId: string,
    groupId: string,
    memberId: string,
  ) {
    const { member } = await this.assertGestorOwnsMember(
      gestorUserId,
      groupId,
      memberId,
    );
    if (!member.userId)
      throw new BadRequestException(
        'Este cotista não possui acesso criado',
      );

    const user = await this.prisma.user.update({
      where: { id: member.userId },
      data: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return { user, member: { id: member.id, name: member.name } };
  }
}
