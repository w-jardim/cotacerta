import { Module } from '@nestjs/common';
import { MemberAccessController } from './member-access.controller';
import { MemberAccessService } from './member-access.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MemberAccessController],
  providers: [MemberAccessService],
})
export class MemberAccessModule {}
