import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CashGroupsModule } from './cash-groups/cash-groups.module';
import { MembersModule } from './members/members.module';
import { ChargesModule } from './charges/charges.module';
import { LoansModule } from './loans/loans.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    CashGroupsModule,
    MembersModule,
    ChargesModule,
    LoansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
