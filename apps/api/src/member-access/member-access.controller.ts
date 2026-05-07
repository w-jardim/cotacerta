import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberAccessService } from './member-access.service';
import { CreateMemberAccessDto } from './dto/create-member-access.dto';

@Controller('cash-groups/:groupId/members/:memberId/access')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_MASTER', 'ADMIN_PLATFORM')
export class MemberAccessController {
  constructor(
    private readonly memberAccessService: MemberAccessService,
  ) {}

  @Post()
  createAccess(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @Body() dto: CreateMemberAccessDto,
  ) {
    return this.memberAccessService.createAccess(
      req.user.id,
      groupId,
      memberId,
      dto.email,
    );
  }

  @Get()
  getAccess(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.memberAccessService.getAccess(
      req.user.id,
      groupId,
      memberId,
    );
  }

  @Patch('block')
  blockAccess(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.memberAccessService.blockAccess(
      req.user.id,
      groupId,
      memberId,
    );
  }

  @Patch('activate')
  activateAccess(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.memberAccessService.activateAccess(
      req.user.id,
      groupId,
      memberId,
    );
  }
}
