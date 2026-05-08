import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type CommunicationDirection =
  | 'ADMIN_TO_MEMBER'
  | 'MEMBER_TO_ADMIN'
  | 'SYSTEM_TO_ADMIN'
  | 'SYSTEM_TO_MEMBER';

export type CommunicationChannel = 'INTERNAL' | 'WHATSAPP' | 'SMS' | 'EMAIL';

export interface CreateMessageOptions {
  senderUserId?: string;
  recipientUserId: string;
  cashGroupId?: string;
  memberId?: string;
  direction: CommunicationDirection;
  channel?: CommunicationChannel;
  title: string;
  body: string;
  eventType?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class CommunicationService {
  constructor(private readonly prisma: PrismaService) {}

  async createInternal(opts: CreateMessageOptions) {
    return this.prisma.communicationMessage.create({
      data: {
        senderUserId: opts.senderUserId ?? null,
        recipientUserId: opts.recipientUserId,
        cashGroupId: opts.cashGroupId ?? null,
        memberId: opts.memberId ?? null,
        direction: opts.direction,
        channel: opts.channel ?? 'INTERNAL',
        title: opts.title,
        body: opts.body,
        eventType: opts.eventType ?? null,
        data: opts.data ? (opts.data as object) : undefined,
      },
    });
  }

  async getMyMessages(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [messages, total, unread] = await Promise.all([
      this.prisma.communicationMessage.findMany({
        where: { recipientUserId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.communicationMessage.count({
        where: { recipientUserId: userId },
      }),
      this.prisma.communicationMessage.count({
        where: { recipientUserId: userId, isRead: false },
      }),
    ]);

    return { messages, total, unread, page, limit };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.communicationMessage.count({
      where: { recipientUserId: userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(userId: string, ids: string[]) {
    await this.prisma.communicationMessage.updateMany({
      where: { recipientUserId: userId, id: { in: ids } },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: ids.length };
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.communicationMessage.updateMany({
      where: { recipientUserId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }

  async sendToMember(
    senderUserId: string,
    opts: {
      recipientUserId: string;
      cashGroupId?: string;
      memberId?: string;
      title: string;
      body: string;
    },
  ) {
    return this.createInternal({
      senderUserId,
      recipientUserId: opts.recipientUserId,
      cashGroupId: opts.cashGroupId,
      memberId: opts.memberId,
      direction: 'ADMIN_TO_MEMBER',
      title: opts.title,
      body: opts.body,
    });
  }

  async contactAdminFromMember(
    senderUserId: string,
    opts: { title: string; body: string },
  ) {
    const member = await this.prisma.member.findUnique({
      where: { userId: senderUserId },
      include: { cashGroup: { select: { id: true, ownerUserId: true } } },
    });

    if (!member) {
      throw new NotFoundException('Cotista não encontrado.');
    }

    return this.createInternal({
      senderUserId,
      recipientUserId: member.cashGroup.ownerUserId,
      cashGroupId: member.cashGroupId,
      memberId: member.id,
      direction: 'MEMBER_TO_ADMIN',
      title: opts.title,
      body: opts.body,
    });
  }
}
