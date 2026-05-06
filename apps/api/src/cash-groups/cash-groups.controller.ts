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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CashGroupsService } from './cash-groups.service';
import { CreateCashGroupDto } from './dto/create-cash-group.dto';
import { UpdateCashGroupDto } from './dto/update-cash-group.dto';

@Controller('cash-groups')
@UseGuards(JwtAuthGuard)
export class CashGroupsController {
  constructor(private readonly cashGroupsService: CashGroupsService) {}

  @Post()
  create(@Request() req, @Body() createDto: CreateCashGroupDto) {
    return this.cashGroupsService.create(req.user.id, createDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.cashGroupsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.cashGroupsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateCashGroupDto,
  ) {
    return this.cashGroupsService.update(id, req.user.id, updateDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.cashGroupsService.remove(id, req.user.id);
  }
}
