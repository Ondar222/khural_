import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { EUserRole } from '../lib/types/user-role';

@Injectable()
export class RoleInitService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.initializeRoles();
  }

  private async initializeRoles() {
    // Initialize admin role
    let adminRole = await this.roleRepository.findOne({ where: { id: EUserRole.admin } });
    if (!adminRole) {
      adminRole = this.roleRepository.create({
        id: EUserRole.admin,
        app_access: true,
        admin_access: true,
      });
      await this.roleRepository.save(adminRole);
      console.log('Admin role initialized');
    }

    // Initialize citizen role
    let citizenRole = await this.roleRepository.findOne({ where: { id: EUserRole.citizen } });
    if (!citizenRole) {
      citizenRole = this.roleRepository.create({
        id: EUserRole.citizen,
        app_access: true,
        admin_access: false,
      });
      await this.roleRepository.save(citizenRole);
      console.log('Citizen role initialized');
    }
  }
}

