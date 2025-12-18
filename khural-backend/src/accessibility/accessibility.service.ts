import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccessibilitySettingsEntity } from './entities/user-accessibility-settings.entity';
import { User } from '../user/user.entity';

@Injectable()
export class AccessibilityService {
  constructor(
    @InjectRepository(UserAccessibilitySettingsEntity)
    private readonly settingsRepository: Repository<UserAccessibilitySettingsEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getSettings(userId?: string, sessionId?: string): Promise<UserAccessibilitySettingsEntity | null> {
    if (userId) {
      return this.settingsRepository.findOne({
        where: { user: { id: userId } },
        relations: ['user'],
      });
    } else if (sessionId) {
      return this.settingsRepository.findOne({
        where: { sessionId },
      });
    }
    return null;
  }

  async saveSettings(dto: {
    userId?: string;
    sessionId?: string;
    fontSize?: number;
    colorScheme?: string;
    contrast?: string;
    disableAnimations?: boolean;
  }): Promise<UserAccessibilitySettingsEntity> {
    let user: User | null = null;
    if (dto.userId) {
      user = await this.userRepository.findOne({ where: { id: dto.userId } });
      if (!user) {
        throw new Error(`User with ID ${dto.userId} not found`);
      }
    }

    let settings = await this.settingsRepository.findOne({
      where: dto.userId
        ? { user: { id: dto.userId } }
        : { sessionId: dto.sessionId },
    });

    if (!settings) {
      settings = this.settingsRepository.create({
        user,
        sessionId: dto.sessionId,
        fontSize: dto.fontSize || 16,
        colorScheme: dto.colorScheme || 'default',
        contrast: dto.contrast || 'normal',
        disableAnimations: dto.disableAnimations || false,
      });
    } else {
      Object.assign(settings, {
        fontSize: dto.fontSize ?? settings.fontSize,
        colorScheme: dto.colorScheme ?? settings.colorScheme,
        contrast: dto.contrast ?? settings.contrast,
        disableAnimations: dto.disableAnimations ?? settings.disableAnimations,
      });
    }

    return this.settingsRepository.save(settings);
  }
}

