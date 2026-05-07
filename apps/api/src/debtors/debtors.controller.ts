import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DebtorsService } from './debtors.service';
import { DebtorsQueryDto } from './dto/debtors-query.dto';

@Controller('debtors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_MASTER', 'ADMIN_PLATFORM')
export class DebtorsGlobalController {
  constructor(private readonly debtorsService: DebtorsService) {}

  @Get()
  getAllDebtors(@Request() req, @Query() query: DebtorsQueryDto) {
    return this.debtorsService.getAllDebtors(
      req.user.id,
      query.cashGroupId,
      query.referenceMonth,
      query.referenceYear,
    );
  }
}

@Controller('cash-groups/:cashGroupId/debtors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_MASTER', 'ADMIN_PLATFORM')
export class DebtorsController {
  constructor(private readonly debtorsService: DebtorsService) {}

  @Get()
  getDebtorsByCashGroup(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Query() query: DebtorsQueryDto,
  ) {
    return this.debtorsService.getDebtorsByCashGroup(
      req.user.id,
      cashGroupId,
      query.referenceMonth,
      query.referenceYear,
    );
  }

  @Get(':memberId/message')
  getDebtorMessage(
    @Request() req,
    @Param('cashGroupId') cashGroupId: string,
    @Param('memberId') memberId: string,
    @Query() query: DebtorsQueryDto,
  ) {
    return this.debtorsService.getDebtorMessage(
      req.user.id,
      cashGroupId,
      memberId,
      query.referenceMonth,
      query.referenceYear,
    );
  }
}
