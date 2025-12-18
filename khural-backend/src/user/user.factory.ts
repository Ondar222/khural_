import { EUserRole } from '../lib/types/user-role';
import { UserCreateDto } from './dto/create.dto';
import { User } from './user.entity';
import { v4 } from 'uuid';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PasswordHelper } from '../common/utils';
import { RoleRepository } from '../role/role.repository';
import { UserRepository } from './user.repository';

@Injectable()
class UserFactory {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async create(dto: UserCreateDto) {
    try {
      const existingUser = await this.userRepository.findOne({
        where: [
          { email: dto.email },
          { phone: dto.phone },
          // { username: dto.username}  //Add user name checks
        ],
      });

      if (existingUser) {
        throw new ConflictException('User with this email or phone already exists');
      }

      if (dto.role === undefined) dto.role = EUserRole.citizen;

      const role = await this.roleRepository.findOne({
        where: { id: dto.role as EUserRole },
      });
      if (!role) throw new BadRequestException('role does not exists');

      const user = new User();

      user.id = v4();
      user.surname = dto.surname;
      user.name = dto.name;
      user.email = dto.email;
      user.phone = dto.phone;
      user.password = dto.password ? await PasswordHelper.hashPassword(dto.password) : '';
      user.status = 'active';
      user.role = role;

      return await this.userRepository.save(user);
    } catch (e: unknown) {
      if (e instanceof ConflictException || e instanceof BadRequestException) {
        throw e;
      }
      if (e instanceof Error) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException('Unknown error occurred');
    }
  }
}

export { UserFactory };
