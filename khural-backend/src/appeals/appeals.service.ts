import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppealEntity } from './entities/appeal.entity';
import { AppealStatusEntity, AppealStatusEnum } from './entities/appeal-status.entity';
import { AppealHistoryEntity } from './entities/appeal-history.entity';
import { User } from '../user/user.entity';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { UpdateAppealDto } from './dto/update-appeal.dto';
import { FilesService } from '../files/files.service';
import { Files } from '../files/files.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class AppealsService {
  constructor(
    @InjectRepository(AppealEntity)
    private readonly appealRepository: Repository<AppealEntity>,
    @InjectRepository(AppealStatusEntity)
    private readonly statusRepository: Repository<AppealStatusEntity>,
    @InjectRepository(AppealHistoryEntity)
    private readonly historyRepository: Repository<AppealHistoryEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly filesService: FilesService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateAppealDto, userId: string): Promise<AppealEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Получаем статус "Принято"
    const receivedStatus = await this.statusRepository.findOne({
      where: { code: AppealStatusEnum.RECEIVED },
    });

    if (!receivedStatus) {
      throw new NotFoundException('Appeal status "received" not found');
    }

    let attachments: Files[] = [];
    if (dto.attachmentIds && dto.attachmentIds.length > 0) {
      attachments = await this.filesService.findMany(dto.attachmentIds);
      if (attachments.length !== dto.attachmentIds.length) {
        throw new NotFoundException('Some attachment files not found');
      }
    }

    const appeal = this.appealRepository.create({
      user,
      subject: dto.subject,
      message: dto.message,
      status: receivedStatus,
      attachments,
    });

    const savedAppeal = await this.appealRepository.save(appeal);

    // Создаем запись в истории
    await this.createHistoryRecord(savedAppeal, receivedStatus, null, null);

    // Отправляем email уведомление пользователю
    try {
      await this.emailService.sendEmail(
        user.email,
        'Ваше обращение принято',
        `Ваше обращение "${dto.subject}" было принято и будет рассмотрено.`,
      );
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }

    return this.findOne(savedAppeal.id);
  }

  async findAll(userId?: string, filters?: {
    statusId?: number;
    dateFrom?: number;
    dateTo?: number;
  }) {
    const queryBuilder = this.appealRepository
      .createQueryBuilder('appeal')
      .leftJoinAndSelect('appeal.user', 'user')
      .leftJoinAndSelect('appeal.status', 'status')
      .leftJoinAndSelect('appeal.attachments', 'attachments')
      .leftJoinAndSelect('appeal.respondedBy', 'respondedBy');

    if (userId) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }

    if (filters?.statusId) {
      queryBuilder.andWhere('status.id = :statusId', {
        statusId: filters.statusId,
      });
    }

    if (filters?.dateFrom) {
      queryBuilder.andWhere('appeal.createdAt >= :dateFrom', {
        dateFrom: new Date(filters.dateFrom),
      });
    }

    if (filters?.dateTo) {
      queryBuilder.andWhere('appeal.createdAt <= :dateTo', {
        dateTo: new Date(filters.dateTo),
      });
    }

    queryBuilder.orderBy('appeal.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findOne(id: number, userId?: string): Promise<AppealEntity> {
    const appeal = await this.appealRepository.findOne({
      where: { id },
      relations: ['user', 'status', 'attachments', 'respondedBy'],
    });

    if (!appeal) {
      throw new NotFoundException(`Appeal with ID ${id} not found`);
    }

    // Пользователь может видеть только свои обращения
    if (userId && appeal.user.id !== userId) {
      throw new ForbiddenException('You can only view your own appeals');
    }

    return appeal;
  }

  async update(
    id: number,
    dto: UpdateAppealDto,
    adminUserId: string,
  ): Promise<AppealEntity> {
    const appeal = await this.findOne(id);

    const adminUser = await this.userRepository.findOne({
      where: { id: adminUserId },
    });
    if (!adminUser) {
      throw new NotFoundException(`Admin user with ID ${adminUserId} not found`);
    }

    let statusChanged = false;
    let oldStatus = appeal.status;

    if (dto.statusId !== undefined) {
      const newStatus = await this.statusRepository.findOne({
        where: { id: dto.statusId },
      });
      if (!newStatus) {
        throw new NotFoundException(`Status with ID ${dto.statusId} not found`);
      }

      if (appeal.status.id !== newStatus.id) {
        appeal.status = newStatus;
        statusChanged = true;
      }
    }

    if (dto.response !== undefined) {
      appeal.response = dto.response;
      appeal.respondedAt = new Date();
      appeal.respondedBy = adminUser;

      // Если есть ответ, статус должен быть "Ответ отправлен"
      if (!statusChanged) {
        const respondedStatus = await this.statusRepository.findOne({
          where: { code: AppealStatusEnum.RESPONDED },
        });
        if (respondedStatus && appeal.status.id !== respondedStatus.id) {
          appeal.status = respondedStatus;
          statusChanged = true;
        }
      }
    }

    const savedAppeal = await this.appealRepository.save(appeal);

    // Создаем запись в истории при изменении статуса
    if (statusChanged) {
      await this.createHistoryRecord(
        savedAppeal,
        appeal.status,
        adminUser,
        dto.response || null,
      );

      // Отправляем email уведомление пользователю
      try {
        const statusName = appeal.status.name;
        await this.emailService.sendEmail(
          appeal.user.email,
          `Статус вашего обращения изменен`,
          `Статус вашего обращения "${appeal.subject}" изменен на "${statusName}".${dto.response ? `\n\nОтвет:\n${dto.response}` : ''}`,
        );
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }

    return this.findOne(savedAppeal.id);
  }

  async delete(id: number): Promise<void> {
    const appeal = await this.findOne(id);
    await this.appealRepository.remove(appeal);
  }

  async getHistory(appealId: number): Promise<AppealHistoryEntity[]> {
    return this.historyRepository.find({
      where: { appeal: { id: appealId } },
      relations: ['status', 'changedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  private async createHistoryRecord(
    appeal: AppealEntity,
    status: AppealStatusEntity,
    changedBy: User | null,
    comment: string | null,
  ): Promise<AppealHistoryEntity> {
    const history = this.historyRepository.create({
      appeal,
      status,
      changedBy,
      comment,
    });

    return this.historyRepository.save(history);
  }

  // Инициализация статусов обращений
  async initializeStatuses(): Promise<void> {
    const statuses = [
      { name: 'Принято', code: AppealStatusEnum.RECEIVED, color: '#007bff', order: 1 },
      { name: 'В работе', code: AppealStatusEnum.IN_PROGRESS, color: '#ffc107', order: 2 },
      { name: 'Ответ отправлен', code: AppealStatusEnum.RESPONDED, color: '#28a745', order: 3 },
      { name: 'Закрыто', code: AppealStatusEnum.CLOSED, color: '#6c757d', order: 4 },
    ];

    for (const statusData of statuses) {
      const existing = await this.statusRepository.findOne({
        where: { code: statusData.code },
      });

      if (!existing) {
        await this.statusRepository.save(
          this.statusRepository.create(statusData),
        );
      }
    }
  }

  async getAllStatuses(): Promise<AppealStatusEntity[]> {
    return this.statusRepository.find({
      order: { order: 'ASC' },
    });
  }
}

