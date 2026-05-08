import { Module } from '@nestjs/common';
import { PixPayloadService } from './pix-payload.service';

@Module({
  providers: [PixPayloadService],
  exports: [PixPayloadService],
})
export class PixModule {}
