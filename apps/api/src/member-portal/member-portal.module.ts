import { Module } from '@nestjs/common';
import { MemberPortalController } from './member-portal.controller';
import { MemberPortalService } from './member-portal.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MemberPortalController],
  providers: [MemberPortalService],
})
export class MemberPortalModule {}
