import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserEntity } from './entity/user.entity';
import { IAccountability } from '../lib/types/accountability';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSearchDta } from './dta/find.dta';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleRepository } from '../role/role.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private  roleRepository: RoleRepository,
  ) {
  }
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const { password, role } = createUserDto;

    const foundRole = await this.roleRepository.findOne({ where: { id: role } });
    if (!foundRole) {
      throw new BadRequestException(`Role "${role}" not found`);
    }

    const user = this.userRepository.create({
      name: createUserDto.name,
      surname: createUserDto.surname,
      phone: createUserDto.phone,
      email: createUserDto.email,
      password: password,
      role: foundRole,
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<UserEntity[]> {
    return this.userRepository.find({ relations: ['role'] });
  }

  async findOne(email: string): Promise<UserEntity | undefined> {
    const user = await this.userRepository.findOne({
      where: { email },
    // relations: {
    //   name: true,
    //   surname: true,
    //   phone: true,
    //   email: true,
    //   role: true,
    //   status: true,
    //   password: true
    // },
    });
    if(!user) {
      throw new NotFoundException(`User with id ${email} not found`);
    }
    return user;
  }

  async update(user: UpdateUserDto, userId: IAccountability["admin"]) {
    await this.userRepository.update(
      {
        id: userId,
      },
      user
    );

    const data = await this.userRepository.save(user);

    return data;
  }

  async updatePassword(email: string, password: string) {
    try {
      await this.userRepository.update({ email }, { password });
    } catch (error) {
      throw error;
    }
  }

}
