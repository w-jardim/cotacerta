import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IsOptional, IsString } from 'class-validator';

class RejectProfileChangeBodyDto {
  @IsOptional() @IsString() rejectionReason?: string;
}

@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_MASTER', 'ADMIN_PLATFORM')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  create(@Request() req, @Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(req.user.id, createMemberDto);
  }

  @Get()
  findAll(@Request() req, @Query('cashGroupId') cashGroupId?: string) {
    if (!cashGroupId) {
      return this.membersService.getAllUserMembers(req.user.id);
    }
    return this.membersService.findAll(req.user.id, cashGroupId);
  }

  @Get('profile-changes')
  getProfileChangeRequests(@Request() req) {
    return this.membersService.getProfileChangeRequests(req.user.id);
  }

  @Patch('profile-changes/:id/approve')
  approveProfileChange(@Request() req, @Param('id') id: string) {
    return this.membersService.approveProfileChange(req.user.id, id);
  }

  @Patch('profile-changes/:id/reject')
  rejectProfileChange(
    @Request() req,
    @Param('id') id: string,
    @Body() body: RejectProfileChangeBodyDto,
  ) {
    return this.membersService.rejectProfileChange(req.user.id, id, body.rejectionReason);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.membersService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return this.membersService.update(req.user.id, id, updateMemberDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.membersService.remove(req.user.id, id);
  }
}
