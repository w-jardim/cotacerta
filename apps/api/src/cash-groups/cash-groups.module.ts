import { Module } from '@nestjs/common';
import { CashGroupsService } from './cash-groups.service';
import { CashGroupsController } from './cash-groups.controller';

@Module({
  controllers: [CashGroupsController],
  providers: [CashGroupsService],
  exports: [CashGroupsService],
})
export class CashGroupsModule {}
