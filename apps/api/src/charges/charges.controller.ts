import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChargesService } from './charges.service';
import { GenerateChargesDto } from './dto/generate-charges.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('charges')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_MASTER', 'ADMIN_PLATFORM')
export class ChargesGlobalController {
  constructor(private readonly chargesService: ChargesService) {}

  @Get()
  getAllUserCharges(@Request() req) {
    return this.chargesService.getAllUserCharges(req.user.id);
  }
}

@Controller('cash-groups/:cashGroupId/charges')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_MASTER', 'ADMIN_PLATFORM')
export class ChargesController {
  constructor(private readonly chargesService: ChargesService) {}

  @Post('generate')
  generateCharges(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Body() dto: GenerateChargesDto,
  ) {
    return this.chargesService.generateCharges(req.user.id, cashGroupId, dto);
  }

  @Get()
  findAll(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Query('referenceMonth') referenceMonth?: string,
    @Query('referenceYear') referenceYear?: string,
  ) {
    return this.chargesService.findAll(
      req.user.id,
      cashGroupId,
      referenceMonth ? parseInt(referenceMonth, 10) : undefined,
      referenceYear ? parseInt(referenceYear, 10) : undefined,
    );
  }

  @Get('debtors')
  findDebtors(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Query('referenceMonth') referenceMonth: string,
    @Query('referenceYear') referenceYear: string,
  ) {
    return this.chargesService.findDebtors(
      req.user.id,
      cashGroupId,
      parseInt(referenceMonth, 10),
      parseInt(referenceYear, 10),
    );
  }

  @Get(':chargeId')
  findOne(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Param('chargeId') chargeId: string,
  ) {
    return this.chargesService.findOne(req.user.id, cashGroupId, chargeId);
  }

  @Post(':chargeId/payments')
  registerPayment(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Param('chargeId') chargeId: string,
    @Body() dto: RegisterPaymentDto,
  ) {
    return this.chargesService.registerPayment(
      req.user.id,
      cashGroupId,
      chargeId,
      dto,
    );
  }

  @Patch(':chargeId/mark-paid')
  markAsPaid(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Param('chargeId') chargeId: string,
    @Body() dto: MarkPaidDto,
  ) {
    return this.chargesService.markAsPaid(
      req.user.id,
      cashGroupId,
      chargeId,
      dto,
    );
  }

  @Patch(':chargeId/cancel')
  cancel(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Param('chargeId') chargeId: string,
  ) {
    return this.chargesService.cancel(req.user.id, cashGroupId, chargeId);
  }
}
