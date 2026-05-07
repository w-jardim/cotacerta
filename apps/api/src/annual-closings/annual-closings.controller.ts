import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnnualClosingsService } from './annual-closings.service';
import { AnnualClosingDto } from './dto/annual-closing.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_MASTER', 'ADMIN_PLATFORM')
@Controller('cash-groups/:groupId/annual-closings')
export class AnnualClosingsController {
  constructor(private readonly service: AnnualClosingsService) {}

  @Post('simulate')
  simulate(
    @Req() req: any,
    @Param('groupId') groupId: string,
    @Body() dto: AnnualClosingDto,
  ) {
    return this.service.simulate(req.user.id, groupId, dto.cycleYear);
  }

  @Post()
  save(
    @Req() req: any,
    @Param('groupId') groupId: string,
    @Body() dto: AnnualClosingDto,
  ) {
    return this.service.saveSimulation(req.user.id, groupId, dto.cycleYear);
  }

  @Get()
  list(@Req() req: any, @Param('groupId') groupId: string) {
    return this.service.list(req.user.id, groupId);
  }

  @Get(':closingId')
  findOne(
    @Req() req: any,
    @Param('groupId') groupId: string,
    @Param('closingId') closingId: string,
  ) {
    return this.service.findOne(req.user.id, groupId, closingId);
  }

  @Patch(':closingId/confirm')
  confirm(
    @Req() req: any,
    @Param('groupId') groupId: string,
    @Param('closingId') closingId: string,
  ) {
    return this.service.confirm(req.user.id, groupId, closingId);
  }

  @Patch(':closingId/cancel')
  cancel(
    @Req() req: any,
    @Param('groupId') groupId: string,
    @Param('closingId') closingId: string,
  ) {
    return this.service.cancel(req.user.id, groupId, closingId);
  }
}
