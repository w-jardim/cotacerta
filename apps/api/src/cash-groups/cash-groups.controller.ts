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
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CashGroupsService } from './cash-groups.service';
import { CreateCashGroupDto } from './dto/create-cash-group.dto';
import { UpdateCashGroupDto } from './dto/update-cash-group.dto';

class ReviewPaymentRequestDto {
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}

@Controller('cash-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_MASTER', 'ADMIN_PLATFORM')
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

  @Patch(':id/restore')
  restore(@Request() req, @Param('id') id: string) {
    return this.cashGroupsService.restore(id, req.user.id);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.cashGroupsService.remove(id, req.user.id);
  }

  @Get(':groupId/receiving-settings')
  getReceivingSettings(@Request() req, @Param('groupId') groupId: string) {
    return this.cashGroupsService.getReceivingSettings(groupId, req.user.id);
  }

  @Patch(':groupId/receiving-settings')
  updateReceivingSettings(
    @Request() req,
    @Param('groupId') groupId: string,
    @Body() updateDto: UpdateCashGroupDto,
  ) {
    return this.cashGroupsService.updateReceivingSettings(
      groupId,
      req.user.id,
      updateDto,
    );
  }

  @Get(':groupId/payment-requests')
  getPaymentRequests(@Request() req, @Param('groupId') groupId: string) {
    return this.cashGroupsService.getPaymentRequests(groupId, req.user.id);
  }

  @Get(':groupId/payment-requests/:requestId/analysis')
  getPaymentRequestAnalysis(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.cashGroupsService.getPaymentRequestAnalysis(
      groupId,
      requestId,
      req.user.id,
    );
  }

  @Post(':groupId/payment-requests/:requestId/analyze')
  analyzePaymentRequest(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.cashGroupsService.analyzePaymentRequest(
      groupId,
      requestId,
      req.user.id,
    );
  }

  @Post(':groupId/payment-requests/:requestId/confirm')
  confirmPaymentRequest(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('requestId') requestId: string,
    @Body() dto: ReviewPaymentRequestDto,
  ) {
    return this.cashGroupsService.confirmPaymentRequest(
      groupId,
      requestId,
      req.user.id,
      dto.reviewNotes,
    );
  }

  @Get(':groupId/ledger')
  getLedger(@Request() req, @Param('groupId') groupId: string) {
    return this.cashGroupsService.getLedger(groupId, req.user.id);
  }

  @Post(':groupId/payment-requests/:requestId/reject')
  rejectPaymentRequest(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('requestId') requestId: string,
    @Body() dto: ReviewPaymentRequestDto,
  ) {
    return this.cashGroupsService.rejectPaymentRequest(
      groupId,
      requestId,
      req.user.id,
      dto.reviewNotes,
    );
  }
}
