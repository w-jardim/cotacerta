import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberPortalService } from './member-portal.service';

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

  @Get('groups')
  getGroups(@Request() req) {
    return this.memberPortalService.getGroups(req.user.id);
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
}
