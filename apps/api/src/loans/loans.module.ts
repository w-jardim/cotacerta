import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LoansController, LoansGlobalController } from './loans.controller';
import { LoansService } from './loans.service';

@Module({
  imports: [PrismaModule],
  controllers: [LoansController, LoansGlobalController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
