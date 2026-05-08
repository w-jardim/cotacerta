import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationService } from './communication.service';
import {
  CommunicationController,
  CommunicationSendController,
  MemberCommunicationController,
} from './communication.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    CommunicationController,
    CommunicationSendController,
    MemberCommunicationController,
  ],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
