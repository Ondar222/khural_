import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonsService } from './persons.service';
import { PersonsController } from './persons.controller';
import { PersonEntity } from './entities/person.entity';
import { Category } from './entities/category.entity';
import { DeclarationEntity } from './entities/declaration.entity';
import { Faction } from './entities/faction.entity';
import { District } from './entities/district.entity';
import { Convocation } from './entities/convocation.entity';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PersonEntity, Category, DeclarationEntity, Faction, District, Convocation]),
    FilesModule,
  ],
  controllers: [PersonsController],
  providers: [PersonsService],
  exports: [PersonsService],
})
export class PersonsModule {} 