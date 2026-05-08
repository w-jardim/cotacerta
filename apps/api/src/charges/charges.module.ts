import { Module } from '@nestjs/common';
import { ChargesController, ChargesGlobalController } from './charges.controller';
import { ChargesService } from './charges.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ReceiptFingerprintModule } from '../common/receipt/receipt-fingerprint.module';

@Module({
  imports: [PrismaModule, ReceiptFingerprintModule],
  controllers: [ChargesController, ChargesGlobalController],
  providers: [ChargesService],
  exports: [ChargesService],
})
export class ChargesModule {}
