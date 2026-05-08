import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CommunicationService } from './communication.service';
import { SendMessageDto, ContactAdminDto, MarkReadDto } from './dto/send-message.dto';

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

  @Patch('mark-read')
  markRead(@Request() req, @Body() dto: MarkReadDto) {
    if (dto.ids?.length) {
      return this.svc.markAsRead(req.user.id, dto.ids);
    }
    return this.svc.markAllAsRead(req.user.id);
  }
}

// Gestor sends message to a cotista
@Controller('communications/send')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_MASTER', 'ADMIN_PLATFORM')
export class CommunicationSendController {
  constructor(private readonly svc: CommunicationService) {}

  @Post()
  sendToMember(@Request() req, @Body() dto: SendMessageDto) {
    return this.svc.sendToMember(req.user.id, {
      recipientUserId: dto.memberId!,
      cashGroupId: dto.cashGroupId,
      title: dto.title,
      body: dto.body,
    });
  }
}

// Cotista contacts admin
@Controller('member-portal/communications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COTISTA')
export class MemberCommunicationController {
  constructor(private readonly svc: CommunicationService) {}

  @Post('contact-admin')
  async contactAdmin(@Request() req, @Body() dto: ContactAdminDto) {
    // Resolve admin userId from member's cash group
    return this.svc.contactAdminFromMember(req.user.id, {
      title: dto.title,
      body: dto.body,
    });
  }
}
