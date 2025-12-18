import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEntity } from "./entities/event.entity";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventsRepo: Repository<EventEntity>,
  ) {}

  async findAll() {
    return await this.eventsRepo.find({ order: { date: "ASC" } });
  }

  async findOne(id: number) {
    const ev = await this.eventsRepo.findOne({ where: { id } });
    if (!ev) throw new NotFoundException(`Event with ID ${id} not found`);
    return ev;
  }

  async create(dto: CreateEventDto) {
    const ev = this.eventsRepo.create(dto);
    return await this.eventsRepo.save(ev);
  }

  async update(id: number, dto: UpdateEventDto) {
    const ev = await this.findOne(id);
    Object.assign(ev, dto);
    return await this.eventsRepo.save(ev);
  }

  async remove(id: number) {
    const ev = await this.findOne(id);
    return await this.eventsRepo.remove(ev);
  }
}




