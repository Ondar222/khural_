import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { DataSource, DeleteResult, Repository } from 'typeorm';
import { User } from './user.entity';
@Injectable()
export class UserRepository extends Repository<User> {
  constructor(dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }
}

// @Injectable()
// class UserRepository extends Repository<User> {
//   constructor(
//     private dataSource: DataSource,
//     @Inject()
//     private readonly bookingArchiveRepository: BookingArchiveRepository,
//   ) {
//     super(User, dataSource.createEntityManager());
//   }
//
//   async getOne(user: Omit<UserSearchDta, 'many'>): Promise<User | null> {
//     // const avatar = this.dataSourse
//     // 	.createQueryBuilder("users")
//     // 	.select("users.id", "userId")
//     // 	.addSelect(
//     // 		`
//     //     CASE
//     //       WHEN users.avatar IS NOT NULL THEN
//     //         jsonb_build_object(
//     //           'id', users.avatar,
//     //           'link', concat('${process.env.CDN}', users.avatar)
//     //         )
//     //       WHEN users.avatar IS NULL THEN NULL
//     //     END`,
//     // 		"avatar"
//     // 	)
//     // 	.from(User, "users")
//     // 	.where("users.phone=:phone", { phone: user.phone })
//     // 	.orWhere("users.email=:email", { email: user.email })
//     // 	.orWhere("users.id=:id", { id: user.id });
//
//     const data: User | undefined = await this.dataSource
//       .getRepository(User)
//       .createQueryBuilder('users')
//       .select(['id', 'name', 'surname', 'email', 'avatar', 'status', 'phone'])
//       .addSelect(
//         `
//           jsonb_build_object(
//             'id', users.role
//           )
//         `,
//         'role',
//       )
//       .addSelect(
//         `
//           CASE
//             WHEN users.avatar IS NOT NULL THEN
//               jsonb_build_object(
//                 'id', users.avatar,
//                 'link', concat('${process.env.CDN}', users.avatar)
//               )
//             WHEN users.avatar IS NULL THEN NULL
//           END`,
//         'avatar',
//       )
//       // .leftJoin(`(${avatar.getQuery()})`, 'avatar', 'users.id=avatar.userId')
//       .where('phone=:phone', { phone: user.phone })
//       .orWhere('email=:email', { email: user.email })
//       .orWhere('id=:id', { id: user.id })
//       .getRawOne();
//
//     if (typeof data === 'undefined') {
//       return null;
//     }
//
//     return data;
//   }
//
//   async deleteUserBookings(userId: string): Promise<DeleteResult> {
//     return await this.dataSource.manager.transaction(async (manager) => {
//       const bookings = await manager.find(Booking, {
//         where: {
//           user: {
//             id: userId,
//           },
//         },
//         relations: {
//           user: true,
//           order: true,
//         },
//       });
//
//       for (const booking of bookings) {
//         if (booking.status === EBookingStatus.PAID) {
//           throw new ConflictException(
//             'Cannot delete user with paid booking(s)',
//           );
//         }
//
//         if (
//           booking.status === EBookingStatus.DRAFT ||
//           booking.status === EBookingStatus.ERRORED ||
//           booking.status === EBookingStatus.PROCESSING
//         ) {
//           await manager.update(
//             Booking,
//             { id: booking.id },
//             {
//               status: EBookingStatus.REJECTED,
//             },
//           );
//         }
//
//         const movedBookingEntity = manager.create(BookingArchive, {
//           ...booking,
//           user: JSON.stringify(booking.user),
//           order: JSON.stringify(booking.order),
//         });
//         await manager.save(BookingArchive, movedBookingEntity);
//         await manager.delete(Booking, { id: booking.id });
//       }
//
//       return await manager.delete(User, userId);
//     });
//   }
// }
//
// export { UserRepository };
