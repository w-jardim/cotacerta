import { Module } from '@nestjs/common';
import { ChargesController, ChargesGlobalController } from './charges.controller';
import { ChargesService } from './charges.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChargesController, ChargesGlobalController],
  providers: [ChargesService],
  exports: [ChargesService],
})
export class ChargesModule {}
