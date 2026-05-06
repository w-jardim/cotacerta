import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashGroupDto } from './dto/create-cash-group.dto';
import { UpdateCashGroupDto } from './dto/update-cash-group.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CashGroupsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateCashGroupDto) {
    return this.prisma.cashGroup.create({
      data: {
        owner: {
          connect: { id: userId },
        },
        name: createDto.name,
        description: createDto.description,
        cycleYear: createDto.cycleYear,
        quotaValue: new Decimal(createDto.quotaValue),
        dueDay: createDto.dueDay,
        maxQuotasPerMember: createDto.maxQuotasPerMember ?? 2,
        defaultLoanInterestRate: new Decimal(createDto.defaultLoanInterestRate ?? 30.00),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.cashGroup.findMany({
      where: {
        ownerUserId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const cashGroup = await this.prisma.cashGroup.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!cashGroup) {
      throw new NotFoundException('Caixinha não encontrada');
    }

    if (cashGroup.ownerUserId !== userId) {
      throw new ForbiddenException('Você não tem permissão para acessar esta caixinha');
    }

    return cashGroup;
  }

  async update(id: string, userId: string, updateDto: UpdateCashGroupDto) {
    // Verifica se a caixinha existe e pertence ao usuário
    await this.findOne(id, userId);

    const data: any = {};

    if (updateDto.name !== undefined) data.name = updateDto.name;
    if (updateDto.description !== undefined) data.description = updateDto.description;
    if (updateDto.quotaValue !== undefined) data.quotaValue = new Decimal(updateDto.quotaValue);
    if (updateDto.dueDay !== undefined) data.dueDay = updateDto.dueDay;
    if (updateDto.maxQuotasPerMember !== undefined) data.maxQuotasPerMember = updateDto.maxQuotasPerMember;
    if (updateDto.defaultLoanInterestRate !== undefined) data.defaultLoanInterestRate = new Decimal(updateDto.defaultLoanInterestRate);
    if (updateDto.status !== undefined) data.status = updateDto.status;

    return this.prisma.cashGroup.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    // Verifica se a caixinha existe e pertence ao usuário
    await this.findOne(id, userId);

    // Soft delete: marca como ARCHIVED
    return this.prisma.cashGroup.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }
}
