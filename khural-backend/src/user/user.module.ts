import { forwardRef, Module } from "@nestjs/common";
import { CacheModule } from '@nestjs/cache-manager';
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { SessionService } from "../session/session.service";
import { AuthService } from "../auth/auth.service";
import { RoleModule } from "../role/role.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Session } from "../session/session.entity";
import { FilesService } from "../files/files.service";

import { UserFactory } from "./user.factory";
import { UserRepository } from "./user.repository";
import { FilesModule } from "../files/files.module";

import { ContactModule } from "../contact/contact.module";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [
    CacheModule.register(),
    TypeOrmModule.forFeature([User, Session]),
    RoleModule,
    forwardRef(() => ContactModule),
    FilesModule,
    NotificationModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    SessionService,
    FilesService,
    AuthService,
    UserFactory,
  ],
  exports: [TypeOrmModule, UserService, UserRepository, UserFactory],
})
export class UserModule {}
