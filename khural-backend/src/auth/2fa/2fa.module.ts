import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TwoFAController } from './2fa.controller';
import { TwoFactorAuthService } from './2fa.service';
import { User2FAEntity } from './entities/user-2fa.entity';
import { User } from '../../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User2FAEntity, User])],
  controllers: [TwoFAController],
  providers: [TwoFactorAuthService],
  exports: [TwoFactorAuthService],
})
export class TwoFAModule {}

