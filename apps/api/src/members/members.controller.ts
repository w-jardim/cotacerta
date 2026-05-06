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

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  create(@Request() req, @Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(req.user.id, createMemberDto);
  }

  @Get()
  findAll(@Request() req, @Query('cashGroupId') cashGroupId?: string) {
    // Se não houver cashGroupId, retorna todos os membros do usuário
    if (!cashGroupId) {
      return this.membersService.getAllUserMembers(req.user.id);
    }
    return this.membersService.findAll(req.user.id, cashGroupId);
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
