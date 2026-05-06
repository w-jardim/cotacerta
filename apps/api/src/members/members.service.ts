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

    // Verificar se a caixinha existe e pertence ao usuário
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

    // Validar quantidade de cotas
    if (quotasCount > cashGroup.maxQuotasPerMember) {
      throw new BadRequestException(
        `Quantidade de cotas não pode exceder ${cashGroup.maxQuotasPerMember}`,
      );
    }

    // Criar cotista
    return this.prisma.member.create({
      data: {
        ...data,
        cashGroupId,
        quotasCount,
      },
    });
  }

  async findAll(userId: string, cashGroupId: string) {
    // Verificar se a caixinha pertence ao usuário
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: { cashGroup: true },
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

    // Validar quantidade de cotas se estiver sendo alterada
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

    // Soft delete: marcar como INACTIVE
    return this.prisma.member.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  async getAllUserMembers(userId: string) {
    // Buscar todas as caixinhas do usuário
    const cashGroups = await this.prisma.cashGroup.findMany({
      where: { ownerUserId: userId },
      select: { id: true },
    });

    const cashGroupIds = cashGroups.map((cg) => cg.id);

    // Buscar todos os membros dessas caixinhas
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
}
