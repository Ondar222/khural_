import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { EventEntity } from './entities/event.entity';
import { EventTypeEntity } from './entities/event-type.entity';
import { PersonEntity } from '../persons/entities/person.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity, EventTypeEntity, PersonEntity]),
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}

