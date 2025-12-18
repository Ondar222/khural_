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
    const email = String(process.env.ADMIN_EMAIL || "admin@khural.local")
      .trim()
      .toLowerCase();
    const password = String(process.env.ADMIN_PASSWORD || "Admin12345!").trim();
    const force = process.env.ADMIN_SEED_FORCE === "true";

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      if (!force) return;

      const hashedPassword = await bcrypt.hash(password, 10);
      existing.password = hashedPassword;
      await this.userRepository.save(existing);
      this.logger.log(`Updated admin password for: ${email}`);
      this.logger.log(
        "Admin password is taken from ADMIN_PASSWORD env (or default Admin12345!).",
      );
      return;
    }

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





