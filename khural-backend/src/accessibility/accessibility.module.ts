import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessibilityController } from './accessibility.controller';
import { AccessibilityService } from './accessibility.service';
import { UserAccessibilitySettingsEntity } from './entities/user-accessibility-settings.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAccessibilitySettingsEntity, User]),
  ],
  controllers: [AccessibilityController],
  providers: [AccessibilityService],
  exports: [AccessibilityService],
})
export class AccessibilityModule {}

