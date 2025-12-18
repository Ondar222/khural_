import { ForbiddenException, Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { EUserRole } from '../lib/types/user-role';
import type { IUserService } from './user.interface';
import { EAppScope, IAccountability } from '../lib/types/';
import { UserUpdateDto } from './dto/update.dto';
import { Files } from '../files/files.entity';
import { UserSearchDta } from './dta/find.dta';
import { PasswordHelper } from '../common/utils';
import { genNormalizePhone } from '../common/utils/phone';
import { DataSource } from 'typeorm';
import { NotificationService } from '../notification/notification.service';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService implements IUserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  async findOne(user: Omit<UserSearchDta, 'many'>) {
    try {
      // Build where conditions
      const where: any = {};
      if (user.id) where.id = user.id;
      if (user.phone) {
        const normalizedPhone = genNormalizePhone(user.phone);
        if (normalizedPhone) where.phone = normalizedPhone;
      }
      if (user.email) {
        const normalizedEmail = String(user.email).trim().toLowerCase();
        if (normalizedEmail) where.email = normalizedEmail;
      }

      if (Object.keys(where).length === 0) {
        return undefined;
      }

      // Use findOne with relations for proper entity mapping
      const found = await this.userRepository.findOne({
        where,
        relations: { role: true, avatar: true },
        select: {
          id: true,
          name: true,
          surname: true,
          patronymic: true,
          email: true,
          phone: true,
          status: true,
          role: {
            id: true,
            admin_access: true,
            app_access: true,
          },
          avatar: {
            id: true,
          },
        },
      });

      if (!found) return undefined;

      // Map to expected format with avatar link
      const cdn = process.env.CDN || '';
      const cdnBase = cdn.endsWith('/') ? cdn : `${cdn}/`;
      const avatarLink = found.avatar?.id
        ? `${cdnBase}${found.avatar.id}`
        : null;

      return {
        id: found.id,
        name: found.name,
        surname: found.surname,
        patronymic: found.patronymic,
        email: found.email,
        phone: found.phone,
        status: found.status,
        role: {
          id: found.role?.id || 'citizen',
          admin_access: found.role?.admin_access || false,
          app_access: found.role?.app_access || true,
        },
        avatar: avatarLink
          ? {
              id: found.avatar.id,
              link: avatarLink,
            }
          : null,
      };
    } catch (e) {
      throw e;
    }
  }

  async findMany(user: Omit<UserSearchDta, 'many'>) {
    const data: User[] | undefined = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'id',
        'name as name',
        'surname as surname',
        'email',
        'role',
        'avatar',
        'status',
        'phone',
      ])
      .where('phone=:phone OR email=:email', { phone: user.phone })
      .orWhere('email=:email', { email: user.email })
      .orWhere('id=:id', { id: user.id })
      .orWhere('id IS NOT NULL')
      .getRawMany();

    return data;
  }

  async checkUserLoginCredentials(email: string, password: string) {
    // Normalize email (trim + lowercase)
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) throw new ForbiddenException('Email is required');

    // Find user with role relation
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      relations: { role: true },
      select: {
        id: true,
        password: true,
        email: true,
        role: {
          id: true,
          admin_access: true,
          app_access: true,
        },
      },
    });

    if (!user) throw new ForbiddenException('Invalid credentials');

    const isCompare = await PasswordHelper.comparePassword(
      password,
      user.password,
    );

    if (!isCompare) throw new ForbiddenException('Invalid credentials');

    return user;
  }

  async update(user: UserUpdateDto, userId: IAccountability['user']) {
    await this.userRepository.update(
      {
        id: userId,
      },
      user,
    );

    const data = await this.findOne({ id: userId });

    return data;
  }

  async updatePassword(email: string, password: string) {
    try {
      await this.userRepository.update({ email }, { password });
    } catch (error) {
      throw error;
    }
  }

  async createUserCredentials(id: string) {
    const user = await this.userRepository.findOneOrFail({
      where: {
        id: id,
      },
      relations: {
        role: true,
      },
      select: {
        id: true,
        role: {
          id: true,
          admin_access: true,
          app_access: true,
        },
      },
    });

    const data: IAccountability = {
      user: user.id,
      role: user.role.id as EUserRole,
      admin: user.role.admin_access,
      app: user.role.app_access,
      scope: EAppScope.LANA_FOOD,
    };

    return data;
  }

  async updateAvatar(userId: string, avatar: Files) {
    const updateResult = await this.userRepository.update(
      {
        id: userId,
      },
      {
        avatar: {
          id: avatar.id,
        },
      },
    );

    return await this.findOne({ id: userId });
  }

  async findUserByIdOrFail(userId: string) {
    return await this.userRepository.findOneOrFail({
      where: {
        id: userId,
      },
      relations: ['bookings'],
    });
  }

  async checkIsUserExists(userId) {
    return await this.userRepository.exists({
      where: {
        id: userId,
      },
    });
  }

  // async delete(userId: string) {
  //   const data = await this.userRepository.deleteUserBookings(userId);
  //
  //   const deleteResult = data[0];
  //   const bookings = data[1];
  //
  //   for (const booking of bookings) {
  //     const email = booking.user.email;
  //
  //     const notificationSendPayload: EmailNotificationSendPayload = {
  //       addressee: email,
  //       subject: `Удаление пользователя с userId: ${userId}`,
  //     };
  //
  //     if (booking.status === EBookingStatus.PAID) {
  //       notificationSendPayload.message =
  //         'Не удалось удалить пользователя из-за оплаченного букинга.';
  //     }
  //
  //     if (
  //       booking.status === EBookingStatus.DRAFT ||
  //       booking.status === EBookingStatus.PROCESSING
  //     ) {
  //       notificationSendPayload.message = 'Отель закрыл доступ к номеру.';
  //     }
  //
  //     await this.notificationService.sendNotification(notificationSendPayload);
  //   }
  //
  //   return deleteResult;
  // }
}
