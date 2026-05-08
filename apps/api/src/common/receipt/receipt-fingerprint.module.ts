import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReceiptFingerprintService } from './receipt-fingerprint.service';

@Module({
  imports: [PrismaModule],
  providers: [ReceiptFingerprintService],
  exports: [ReceiptFingerprintService],
})
export class ReceiptFingerprintModule {}
