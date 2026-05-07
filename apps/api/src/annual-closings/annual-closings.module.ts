import { Module } from '@nestjs/common';
import { AnnualClosingsController } from './annual-closings.controller';
import { AnnualClosingsService } from './annual-closings.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnnualClosingsController],
  providers: [AnnualClosingsService],
})
export class AnnualClosingsModule {}
