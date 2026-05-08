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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  MemberPortalService,
  UpdateMemberProfileDto,
  SubmitPaymentRequestDto,
  StartPixPaymentDto,
  AttachPaymentReceiptDto,
} from './member-portal.service';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateProfileBodyDto implements UpdateMemberProfileDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(14) cpf?: string;
  @IsOptional() @IsString() @MaxLength(15) phone?: string;
  @IsOptional() @IsString() @MaxLength(100) pixKey?: string;
  @IsOptional() @IsString() @MaxLength(100) bankInstitution?: string;
  @IsOptional() @IsString() @MaxLength(100) bankAccountHolder?: string;
}

class SubmitPaymentRequestBodyDto implements SubmitPaymentRequestDto {
  @IsEnum(['MONTHLY_CHARGE', 'LOAN']) type: 'MONTHLY_CHARGE' | 'LOAN';
  @IsOptional() @IsString() monthlyChargeId?: string;
  @IsOptional() @IsString() loanId?: string;
  @IsEnum(['PIX', 'CASH', 'OTHER']) method: 'PIX' | 'CASH' | 'OTHER';
  @IsNotEmpty() @IsNumber() @Min(0.01) @Type(() => Number) amountDeclared: number;
  @IsOptional() @IsString() receiptFileName?: string;
  @IsOptional() @IsString() receiptMimeType?: string;
  @IsOptional() @IsString() receiptDataUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

class StartPixPaymentBodyDto implements StartPixPaymentDto {
  @IsIn(['PIX'])
  method: 'PIX';

  @IsOptional()
  @IsIn(['FULL', 'INTEREST_ONLY'])
  paymentScope?: 'FULL' | 'INTEREST_ONLY';
}

class AttachPaymentReceiptBodyDto implements AttachPaymentReceiptDto {
  @IsString() receiptFileName: string;
  @IsString() receiptMimeType: string;
  @IsString() receiptDataUrl: string;
}

@Controller('member-portal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COTISTA')
export class MemberPortalController {
  constructor(
    private readonly memberPortalService: MemberPortalService,
  ) {}

  @Get('me')
  getMe(@Request() req) {
    return this.memberPortalService.getMe(req.user.id);
  }

  @Patch('me')
  updateMe(@Request() req, @Body() dto: UpdateProfileBodyDto) {
    return this.memberPortalService.updateMe(req.user.id, dto);
  }

  @Get('groups')
  getGroups(@Request() req) {
    return this.memberPortalService.getGroups(req.user.id);
  }

  @Get('groups/:groupId/receiving-settings')
  getReceivingSettings(@Request() req, @Param('groupId') groupId: string) {
    return this.memberPortalService.getReceivingSettings(req.user.id, groupId);
  }

  @Get('charges')
  getCharges(
    @Request() req,
    @Query('groupId') groupId?: string,
    @Query('referenceMonth') referenceMonth?: number,
    @Query('referenceYear') referenceYear?: number,
  ) {
    return this.memberPortalService.getCharges(
      req.user.id,
      groupId,
      referenceMonth,
      referenceYear,
    );
  }

  @Get('payments')
  getPayments(@Request() req) {
    return this.memberPortalService.getPayments(req.user.id);
  }

  @Get('loans')
  getLoans(@Request() req) {
    return this.memberPortalService.getLoans(req.user.id);
  }

  @Get('debts')
  getDebts(@Request() req) {
    return this.memberPortalService.getDebts(req.user.id);
  }

  @Post('payment-requests')
  submitPaymentRequest(
    @Request() req,
    @Body() dto: SubmitPaymentRequestBodyDto,
  ) {
    return this.memberPortalService.submitPaymentRequest(req.user.id, dto);
  }

  @Get('payment-requests')
  getPaymentRequests(@Request() req) {
    return this.memberPortalService.getPaymentRequests(req.user.id);
  }

  @Post('charges/:chargeId/pay')
  startChargePixPayment(
    @Request() req,
    @Param('chargeId') chargeId: string,
    @Body() dto: StartPixPaymentBodyDto,
  ) {
    return this.memberPortalService.startChargePixPayment(
      req.user.id,
      chargeId,
      dto,
    );
  }

  @Post('loans/:loanId/pay')
  startLoanPixPayment(
    @Request() req,
    @Param('loanId') loanId: string,
    @Body() dto: StartPixPaymentBodyDto,
  ) {
    return this.memberPortalService.startLoanPixPayment(req.user.id, loanId, dto);
  }

  @Patch('payment-requests/:requestId/receipt')
  attachPaymentReceipt(
    @Request() req,
    @Param('requestId') requestId: string,
    @Body() dto: AttachPaymentReceiptBodyDto,
  ) {
    return this.memberPortalService.attachPaymentReceipt(
      req.user.id,
      requestId,
      dto,
    );
  }
}
