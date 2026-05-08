import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CommunicationService } from './communication.service';
import { SendMessageDto, ContactAdminDto, MarkReadDto } from './dto/send-message.dto';

class ReplyDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  body!: string;
}

// Shared inbox (works for any authenticated user)
@Controller('communications')
@UseGuards(JwtAuthGuard)
export class CommunicationController {
  constructor(private readonly svc: CommunicationService) {}

  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.svc.getUnreadCount(req.user.id);
  }

  @Get('inbox')
  getInbox(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.svc.getMyMessages(req.user.id, page, limit);
  }

  @Get(':id')
  getMessage(@Request() req, @Param('id') id: string) {
    return this.svc.getMessage(req.user.id, id);
  }

  @Patch('mark-read')
  markRead(@Request() req, @Body() dto: MarkReadDto) {
    if (dto.ids?.length) return this.svc.markAsRead(req.user.id, dto.ids);
    return this.svc.markAllAsRead(req.user.id);
  }
}

// Admin-only: send message and reply
@Controller('communications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_MASTER', 'ADMIN_PLATFORM')
export class CommunicationAdminController {
  constructor(private readonly svc: CommunicationService) {}

  @Post('send')
  sendToMember(@Request() req, @Body() dto: SendMessageDto) {
    return this.svc.sendToMemberByMemberId(req.user.id, {
      memberId: dto.memberId!,
      title: dto.title,
      body: dto.body,
      cashGroupId: dto.cashGroupId,
    });
  }

  @Post(':id/reply')
  reply(@Request() req, @Param('id') id: string, @Body() dto: ReplyDto) {
    return this.svc.replyToMessage(req.user.id, id, dto.body);
  }
}

// Cotista: contact admin
@Controller('member-portal/communications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COTISTA')
export class MemberCommunicationController {
  constructor(private readonly svc: CommunicationService) {}

  @Post('contact-admin')
  contactAdmin(@Request() req, @Body() dto: ContactAdminDto) {
    return this.svc.contactAdminFromMember(req.user.id, {
      title: dto.title,
      body: dto.body,
    });
  }
}
