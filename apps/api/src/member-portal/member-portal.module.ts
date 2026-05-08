import { Module } from '@nestjs/common';
import { MemberPortalController } from './member-portal.controller';
import { MemberPortalService } from './member-portal.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PixModule } from '../pix/pix.module';
import { PaymentRequestsModule } from '../payment-requests/payment-requests.module';
import { ReceiptFingerprintModule } from '../common/receipt/receipt-fingerprint.module';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [PrismaModule, PixModule, PaymentRequestsModule, ReceiptFingerprintModule, CommunicationModule],
  controllers: [MemberPortalController],
  providers: [MemberPortalService],
})
export class MemberPortalModule {}
