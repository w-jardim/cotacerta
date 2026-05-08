import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createMemberDto: CreateMemberDto) {
    const { cashGroupId, quotasCount, ...data } = createMemberDto;

    const cashGroup = await this.prisma.cashGroup.findUnique({
      where: { id: cashGroupId },
    });

    if (!cashGroup) {
      throw new NotFoundException('Caixinha não encontrada');
    }

    if (cashGroup.ownerUserId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para adicionar cotistas nesta caixinha',
      );
    }

    if (quotasCount > cashGroup.maxQuotasPerMember) {
      throw new BadRequestException(
        `Quantidade de cotas não pode exceder ${cashGroup.maxQuotasPerMember}`,
      );
    }

    return this.prisma.member.create({
      data: {
        ...data,
        cashGroupId,
        quotasCount,
      },
    });
  }

  async findAll(userId: string, cashGroupId: string) {
    const cashGroup = await this.prisma.cashGroup.findUnique({
      where: { id: cashGroupId },
    });

    if (!cashGroup) {
      throw new NotFoundException('Caixinha não encontrada');
    }

    if (cashGroup.ownerUserId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar cotistas desta caixinha',
      );
    }

    return this.prisma.member.findMany({
      where: { cashGroupId },
      include: {
        user: { select: { id: true, email: true, status: true } },
        profileChangeRequests: {
          where: { status: 'PENDING' },
          select: { id: true, createdAt: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        cashGroup: true,
        user: { select: { id: true, email: true, status: true } },
        profileChangeRequests: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Cotista não encontrado');
    }

    if (member.cashGroup.ownerUserId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar este cotista',
      );
    }

    return member;
  }

  async update(userId: string, id: string, updateMemberDto: UpdateMemberDto) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: { cashGroup: true },
    });

    if (!member) {
      throw new NotFoundException('Cotista não encontrado');
    }

    if (member.cashGroup.ownerUserId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este cotista',
      );
    }

    if (updateMemberDto.quotasCount !== undefined) {
      if (updateMemberDto.quotasCount > member.cashGroup.maxQuotasPerMember) {
        throw new BadRequestException(
          `Quantidade de cotas não pode exceder ${member.cashGroup.maxQuotasPerMember}`,
        );
      }
    }

    return this.prisma.member.update({
      where: { id },
      data: updateMemberDto,
    });
  }

  async remove(userId: string, id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: { cashGroup: true },
    });

    if (!member) {
      throw new NotFoundException('Cotista não encontrado');
    }

    if (member.cashGroup.ownerUserId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para remover este cotista',
      );
    }

    return this.prisma.member.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  async getAllUserMembers(userId: string) {
    const cashGroups = await this.prisma.cashGroup.findMany({
      where: { ownerUserId: userId },
      select: { id: true },
    });

    const cashGroupIds = cashGroups.map((cg) => cg.id);

    return this.prisma.member.findMany({
      where: { cashGroupId: { in: cashGroupIds } },
      include: {
        cashGroup: {
          select: {
            id: true,
            name: true,
            cycleYear: true,
            quotaValue: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProfileChangeRequests(userId: string) {
    const cashGroups = await this.prisma.cashGroup.findMany({
      where: { ownerUserId: userId },
      select: { id: true },
    });
    const cashGroupIds = cashGroups.map((cg) => cg.id);

    return this.prisma.memberProfileChangeRequest.findMany({
      where: {
        status: 'PENDING',
        member: { cashGroupId: { in: cashGroupIds } },
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            cashGroupId: true,
            cashGroup: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveProfileChange(userId: string, requestId: string) {
    const request = await this.prisma.memberProfileChangeRequest.findUnique({
      where: { id: requestId },
      include: {
        member: { include: { cashGroup: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    if (request.member.cashGroup.ownerUserId !== userId) {
      throw new ForbiddenException('Sem permissão para aprovar esta solicitação');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Esta solicitação já foi processada');
    }

    const data = request.requestedData as Record<string, any>;

    await this.prisma.$transaction([
      this.prisma.member.update({
        where: { id: request.memberId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.pixKey !== undefined && { pixKey: data.pixKey }),
          ...(data.cpf !== undefined && { cpf: data.cpf }),
          ...(data.bankInstitution !== undefined && { bankInstitution: data.bankInstitution }),
          ...(data.bankAccountHolder !== undefined && { bankAccountHolder: data.bankAccountHolder }),
        },
      }),
      this.prisma.memberProfileChangeRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', reviewedAt: new Date() },
      }),
    ]);

    return { message: 'Alteração de perfil aprovada com sucesso' };
  }

  async rejectProfileChange(userId: string, requestId: string, rejectionReason?: string) {
    const request = await this.prisma.memberProfileChangeRequest.findUnique({
      where: { id: requestId },
      include: {
        member: { include: { cashGroup: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    if (request.member.cashGroup.ownerUserId !== userId) {
      throw new ForbiddenException('Sem permissão para rejeitar esta solicitação');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Esta solicitação já foi processada');
    }

    await this.prisma.memberProfileChangeRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason ?? null,
        reviewedAt: new Date(),
      },
    });

    return { message: 'Solicitação rejeitada' };
  }
}
