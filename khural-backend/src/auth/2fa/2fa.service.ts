import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User2FAEntity } from './entities/user-2fa.entity';
import { User } from '../../user/user.entity';
// TODO: Установить зависимости: npm install speakeasy qrcode @types/speakeasy @types/qrcode
// import * as speakeasy from 'speakeasy';
// import * as qrcode from 'qrcode';

@Injectable()
export class TwoFactorAuthService {
  constructor(
    @InjectRepository(User2FAEntity)
    private readonly twoFARepository: Repository<User2FAEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async generateSecret(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // TODO: Раскомментировать после установки speakeasy
    // const secret = speakeasy.generateSecret({
    //   name: `Khural (${user.email})`,
    //   issuer: 'Верховный Хурал РТ',
    // });

    // Временная заглушка
    const secret = {
      base32: 'TEMPORARY_SECRET_PLEASE_INSTALL_SPEAKEASY',
      otpauth_url: 'otpauth://totp/Khural?secret=TEMPORARY_SECRET',
    };

    // Сохраняем секрет (но не активируем)
    let twoFA = await this.twoFARepository.findOne({
      where: { user: { id: userId } },
    });

    if (!twoFA) {
      twoFA = this.twoFARepository.create({
        user,
        secret: secret.base32,
        isEnabled: false,
      });
    } else {
      twoFA.secret = secret.base32;
      twoFA.isEnabled = false;
    }

    await this.twoFARepository.save(twoFA);

    // TODO: Раскомментировать после установки qrcode
    // const qrCode = await qrcode.toDataURL(secret.otpauth_url);
    const qrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; // Заглушка

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  async verifyToken(userId: string, token: string): Promise<boolean> {
    const twoFA = await this.twoFARepository.findOne({
      where: { user: { id: userId } },
    });

    if (!twoFA || !twoFA.isEnabled) {
      return false;
    }

    // TODO: Раскомментировать после установки speakeasy
    // const verified = speakeasy.totp.verify({
    //   secret: twoFA.secret,
    //   encoding: 'base32',
    //   token,
    //   window: 2, // Разрешаем отклонение в ±2 интервала
    // });

    // Временная заглушка
    return false;
  }

  async enable2FA(userId: string, token: string): Promise<boolean> {
    const twoFA = await this.twoFARepository.findOne({
      where: { user: { id: userId } },
    });

    if (!twoFA) {
      throw new NotFoundException('2FA secret not found. Generate secret first.');
    }

    // TODO: Раскомментировать после установки speakeasy
    // const verified = speakeasy.totp.verify({
    //   secret: twoFA.secret,
    //   encoding: 'base32',
    //   token,
    // });

    // Временная заглушка
    const verified = false;

    if (verified) {
      twoFA.isEnabled = true;
      await this.twoFARepository.save(twoFA);
      return true;
    }

    return false;
  }

  async disable2FA(userId: string): Promise<void> {
    const twoFA = await this.twoFARepository.findOne({
      where: { user: { id: userId } },
    });

    if (twoFA) {
      twoFA.isEnabled = false;
      await this.twoFARepository.save(twoFA);
    }
  }

  async is2FAEnabled(userId: string): Promise<boolean> {
    const twoFA = await this.twoFARepository.findOne({
      where: { user: { id: userId } },
    });

    return twoFA?.isEnabled || false;
  }
}

