import { ForbiddenException, Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { EUserRole } from '../lib/types/user-role';
import type { IUserService } from './user.interface';
import { EAppScope, IAccountability } from '../lib/types/';
import { UserUpdateDto } from './dto/update.dto';
import { Files } from '../files/files.entity';
import { UserSearchDta } from './dta/find.dta';
import { PasswordHelper } from '../common/utils';
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
      const avatar = await this.userRepository
        .createQueryBuilder('users')
        .select('users.id', 'userId')
        .addSelect(
          `
          CASE 
            WHEN users.avatar IS NOT NULL THEN
              jsonb_build_object(
                'id', users.avatar,
                'link', concat('${process.env.CDN}', users.avatar)
              )
            WHEN users.avatar IS NULL THEN NULL
          END`,
          'avatar',
        )
        .from(User, 'users')
        .where('users.phone=:phone', { phone: user.phone })
        .orWhere('users.email=:email', { email: user.email })
        .orWhere('users.id=:id', { id: user.id });

      return await this.userRepository
        .createQueryBuilder('users')
        .select(['id', 'name', 'surname', 'email', 'avatar', 'status', 'phone'])
        .addSelect(
          `
          jsonb_build_object(
            'id', users.role
          )
        `,
          'role',
        )
        .addSelect(
          `
          CASE 
            WHEN users.avatar IS NOT NULL THEN
              jsonb_build_object(
                'id', users.avatar,
                'link', concat('${process.env.CDN}', users.avatar)
              )
            WHEN users.avatar IS NULL THEN NULL
          END`,
          'avatar',
        )
        // .leftJoin(`(${avatar.getQuery()})`, 'avatar', 'users.id=avatar.userId')
        .where('phone=:phone', { phone: user.phone })
        .orWhere('email=:email', { email: user.email })
        .orWhere('id=:id', { id: user.id })
        .getRawOne();
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
    const user: User | undefined = await this.userRepository
      .createQueryBuilder()
      .select('user.id', 'id')
      .addSelect('user.password', 'password')
      .addSelect(
        `JSONB_BUILD_OBJECT(
					'id', user.role,
					'admin_access', false,
					'app_access', true
				)`,
        'role',
      )
      .from(User, 'user')
      .where('user.email=:email', { email })
      .getRawOne();

    if (!user) throw new ForbiddenException();

    const isCompare = await PasswordHelper.comparePassword(
      password,
      user.password,
    );

    if (!isCompare) throw new ForbiddenException();

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
