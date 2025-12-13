import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthService } from './auth.service';
import { JwtAuthService } from './jwt.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { NotificationModule } from '../notification/notification.module';
import { AdminSeedService } from './admin-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
    NotificationModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthService, JwtStrategy, AdminSeedService],
  exports: [AuthService, JwtAuthService],
})
export class AuthModule {}
