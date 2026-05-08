import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationService } from './communication.service';
import {
  CommunicationController,
  CommunicationAdminController,
  MemberCommunicationController,
} from './communication.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    CommunicationController,
    CommunicationAdminController,
    MemberCommunicationController,
  ],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
