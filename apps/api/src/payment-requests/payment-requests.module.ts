import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { PaymentRequestAnalysisService } from './payment-request-analysis.service';

@Module({
  imports: [PrismaModule, AIModule],
  providers: [PaymentRequestAnalysisService],
  exports: [PaymentRequestAnalysisService],
})
export class PaymentRequestsModule {}
