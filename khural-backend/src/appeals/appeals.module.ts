import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppealsController } from './appeals.controller';
import { AppealsService } from './appeals.service';
import { AppealEntity } from './entities/appeal.entity';
import { AppealStatusEntity } from './entities/appeal-status.entity';
import { AppealHistoryEntity } from './entities/appeal-history.entity';
import { User } from '../user/user.entity';
import { FilesModule } from '../files/files.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppealEntity,
      AppealStatusEntity,
      AppealHistoryEntity,
      User,
    ]),
    FilesModule,
    EmailModule,
  ],
  controllers: [AppealsController],
  providers: [AppealsService],
  exports: [AppealsService],
})
export class AppealsModule implements OnModuleInit {
  constructor(private readonly appealsService: AppealsService) {}

  async onModuleInit() {
    // Инициализируем статусы обращений при старте модуля
    await this.appealsService.initializeStatuses();
  }
}

