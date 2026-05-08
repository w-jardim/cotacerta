import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentRequestAnalysisService } from './payment-request-analysis.service';

@Module({
  imports: [PrismaModule],
  providers: [PaymentRequestAnalysisService],
  exports: [PaymentRequestAnalysisService],
})
export class PaymentRequestsModule {}
