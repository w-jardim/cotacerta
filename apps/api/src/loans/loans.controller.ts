import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ListLoansDto } from './dto/list-loans.dto';
import { RegisterLoanPaymentDto } from './dto/register-loan-payment.dto';
import { LoansService } from './loans.service';

@Controller('loans')
@UseGuards(JwtAuthGuard)
export class LoansGlobalController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  findAllUserLoans(@Request() req, @Query() query: ListLoansDto) {
    return this.loansService.findAllUserLoans(req.user.id, query.status);
  }
}

@Controller('cash-groups/:cashGroupId/loans')
@UseGuards(JwtAuthGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  create(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Body() dto: CreateLoanDto,
  ) {
    return this.loansService.create(req.user.id, cashGroupId, dto);
  }

  @Get()
  findAll(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Query() query: ListLoansDto,
  ) {
    return this.loansService.findAll(req.user.id, cashGroupId, query.status);
  }

  @Get(':loanId')
  findOne(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Param('loanId') loanId: string,
  ) {
    return this.loansService.findOne(req.user.id, cashGroupId, loanId);
  }

  @Patch(':loanId/cancel')
  cancel(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Param('loanId') loanId: string,
  ) {
    return this.loansService.cancel(req.user.id, cashGroupId, loanId);
  }

  @Post(':loanId/payments')
  registerPayment(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Param('loanId') loanId: string,
    @Body() dto: RegisterLoanPaymentDto,
  ) {
    return this.loansService.registerPayment(req.user.id, cashGroupId, loanId, dto);
  }

  @Get(':loanId/payments')
  listPayments(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Param('loanId') loanId: string,
  ) {
    return this.loansService.listPayments(req.user.id, cashGroupId, loanId);
  }

  @Patch(':loanId/payments/:paymentId/cancel')
  cancelPayment(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Param('loanId') loanId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.loansService.cancelPayment(
      req.user.id,
      cashGroupId,
      loanId,
      paymentId,
    );
  }
}
