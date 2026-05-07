import { Module } from '@nestjs/common';
import {
  DebtorsController,
  DebtorsGlobalController,
} from './debtors.controller';
import { DebtorsService } from './debtors.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DebtorsController, DebtorsGlobalController],
  providers: [DebtorsService],
})
export class DebtorsModule {}
