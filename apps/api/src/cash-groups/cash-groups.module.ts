import { Module } from '@nestjs/common';
import { CashGroupsService } from './cash-groups.service';
import { CashGroupsController } from './cash-groups.controller';
import { PaymentRequestsModule } from '../payment-requests/payment-requests.module';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [PaymentRequestsModule, CommunicationModule],
  controllers: [CashGroupsController],
  providers: [CashGroupsService],
  exports: [CashGroupsService],
})
export class CashGroupsModule {}
