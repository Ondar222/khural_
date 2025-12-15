import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "./entities/user.entity";

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const email = process.env.ADMIN_EMAIL || "admin@khural.local";
    const password = process.env.ADMIN_PASSWORD || "Admin12345!";

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) return;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
    });

    await this.userRepository.save(user);

    // Do not log password, just hint where it comes from
    this.logger.log(`Created admin user: ${email}`);
    this.logger.log(
      "Admin password is taken from ADMIN_PASSWORD env (or default Admin12345!).",
    );
  }
}



