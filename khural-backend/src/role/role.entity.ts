import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { User } from "../user/user.entity";
import { EUserRole } from "../lib/types/user-role";

@Entity({ name: "roles" })
export class Role {
  @PrimaryColumn({ enum: EUserRole, unique: true })
  id: EUserRole;

  @Column({
    name: "app_access",
    default: true,
  })
  app_access: boolean;

  @Column({
    name: "admin_access",
    default: false,
  })
  admin_access: boolean;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
