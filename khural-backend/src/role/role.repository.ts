import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Role } from "./role.entity";
import { EUserRole } from "../lib/types/user-role";

@Injectable()
export class RoleRepository extends Repository<Role> {
  constructor(private dataSourse: DataSource) {
    super(Role, dataSourse.createEntityManager());
  }

  async findOneById(id: EUserRole) {
    return await this.dataSourse.manager.findOneBy(Role, {
      id,
    });
  }
}
