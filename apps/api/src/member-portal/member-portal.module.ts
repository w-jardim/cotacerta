import { Module } from '@nestjs/common';
import { MemberPortalController } from './member-portal.controller';
import { MemberPortalService } from './member-portal.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PixModule } from '../pix/pix.module';

@Module({
  imports: [PrismaModule, PixModule],
  controllers: [MemberPortalController],
  providers: [MemberPortalService],
})
export class MemberPortalModule {}
