import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { EventEntity } from './entities/event.entity';
import { EventTypeEntity } from './entities/event-type.entity';
import { PersonEntity } from '../persons/entities/person.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
    @InjectRepository(EventTypeEntity)
    private readonly eventTypeRepository: Repository<EventTypeEntity>,
    @InjectRepository(PersonEntity)
    private readonly personRepository: Repository<PersonEntity>,
  ) {}

  async create(dto: CreateEventDto): Promise<EventEntity> {
    let eventType: EventTypeEntity | null = null;
    if (dto.eventTypeId) {
      eventType = await this.eventTypeRepository.findOne({
        where: { id: dto.eventTypeId },
      });
      if (!eventType) {
        throw new NotFoundException(
          `Event type with ID ${dto.eventTypeId} not found`,
        );
      }
    }

    let participants: PersonEntity[] = [];
    if (dto.participantIds && dto.participantIds.length > 0) {
      participants = await this.personRepository.find({
        where: dto.participantIds.map((id) => ({ id })),
      });
      if (participants.length !== dto.participantIds.length) {
        throw new NotFoundException('Some participants not found');
      }
    }

    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    if (endDate && endDate < startDate) {
      throw new NotFoundException('End date must be after start date');
    }

    const event = this.eventRepository.create({
      title: dto.title,
      description: dto.description,
      startDate,
      endDate,
      location: dto.location,
      eventType,
      participants,
      isPublic: dto.isPublic ?? true,
    });

    const savedEvent = await this.eventRepository.save(event);
    return this.findOne(savedEvent.id);
  }

  async findAll(filters?: {
    year?: number;
    month?: number;
    dateFrom?: number;
    dateTo?: number;
    eventTypeId?: number;
    isPublic?: boolean;
  }) {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.eventType', 'eventType')
      .leftJoinAndSelect('event.participants', 'participants');

    if (filters?.year) {
      queryBuilder.andWhere('EXTRACT(YEAR FROM event.startDate) = :year', {
        year: filters.year,
      });
    }

    if (filters?.month) {
      queryBuilder.andWhere('EXTRACT(MONTH FROM event.startDate) = :month', {
        month: filters.month,
      });
    }

    if (filters?.dateFrom) {
      queryBuilder.andWhere('event.startDate >= :dateFrom', {
        dateFrom: new Date(filters.dateFrom),
      });
    }

    if (filters?.dateTo) {
      queryBuilder.andWhere('event.startDate <= :dateTo', {
        dateTo: new Date(filters.dateTo),
      });
    }

    if (filters?.eventTypeId) {
      queryBuilder.andWhere('eventType.id = :eventTypeId', {
        eventTypeId: filters.eventTypeId,
      });
    }

    if (filters?.isPublic !== undefined) {
      queryBuilder.andWhere('event.isPublic = :isPublic', {
        isPublic: filters.isPublic,
      });
    } else {
      // По умолчанию показываем только публичные события
      queryBuilder.andWhere('event.isPublic = :isPublic', { isPublic: true });
    }

    queryBuilder.orderBy('event.startDate', 'ASC');

    return queryBuilder.getMany();
  }

  async findByMonth(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.eventRepository.find({
      where: {
        startDate: Between(startDate, endDate),
        isPublic: true,
      },
      relations: ['eventType', 'participants'],
      order: { startDate: 'ASC' },
    });
  }

  async findByYear(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    return this.eventRepository.find({
      where: {
        startDate: Between(startDate, endDate),
        isPublic: true,
      },
      relations: ['eventType', 'participants'],
      order: { startDate: 'ASC' },
    });
  }

  async findOne(id: number): Promise<EventEntity> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['eventType', 'participants'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async update(id: number, dto: UpdateEventDto): Promise<EventEntity> {
    const event = await this.findOne(id);

    if (dto.eventTypeId !== undefined) {
      if (dto.eventTypeId === null) {
        event.eventType = null;
      } else {
        const eventType = await this.eventTypeRepository.findOne({
          where: { id: dto.eventTypeId },
        });
        if (!eventType) {
          throw new NotFoundException(
            `Event type with ID ${dto.eventTypeId} not found`,
          );
        }
        event.eventType = eventType;
      }
    }

    if (dto.participantIds !== undefined) {
      if (dto.participantIds.length === 0) {
        event.participants = [];
      } else {
        const participants = await this.personRepository.find({
          where: dto.participantIds.map((id) => ({ id })),
        });
        if (participants.length !== dto.participantIds.length) {
          throw new NotFoundException('Some participants not found');
        }
        event.participants = participants;
      }
    }

    if (dto.startDate !== undefined) {
      event.startDate = new Date(dto.startDate);
    }

    if (dto.endDate !== undefined) {
      event.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }

    if (dto.endDate !== undefined && event.endDate && event.endDate < event.startDate) {
      throw new NotFoundException('End date must be after start date');
    }

    Object.assign(event, {
      title: dto.title ?? event.title,
      description: dto.description ?? event.description,
      location: dto.location ?? event.location,
      isPublic: dto.isPublic ?? event.isPublic,
    });

    const savedEvent = await this.eventRepository.save(event);
    return this.findOne(savedEvent.id);
  }

  async delete(id: number): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);
  }

  // CRUD для типов событий
  async getAllEventTypes(): Promise<EventTypeEntity[]> {
    return this.eventTypeRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createEventType(
    name: string,
    color?: string,
  ): Promise<EventTypeEntity> {
    const eventType = this.eventTypeRepository.create({
      name,
      color: color || '#007bff',
    });

    return this.eventTypeRepository.save(eventType);
  }

  async updateEventType(
    id: number,
    name?: string,
    color?: string,
  ): Promise<EventTypeEntity> {
    const eventType = await this.eventTypeRepository.findOne({
      where: { id },
    });

    if (!eventType) {
      throw new NotFoundException(`Event type with ID ${id} not found`);
    }

    if (name !== undefined) eventType.name = name;
    if (color !== undefined) eventType.color = color;

    return this.eventTypeRepository.save(eventType);
  }

  async deleteEventType(id: number): Promise<void> {
    const eventType = await this.eventTypeRepository.findOne({
      where: { id },
      relations: ['events'],
    });

    if (!eventType) {
      throw new NotFoundException(`Event type with ID ${id} not found`);
    }

    if (eventType.events && eventType.events.length > 0) {
      throw new NotFoundException(
        'Cannot delete event type with associated events',
      );
    }

    await this.eventTypeRepository.remove(eventType);
  }
}

