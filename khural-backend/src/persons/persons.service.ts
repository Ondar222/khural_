import { Injectable, NotFoundException, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonEntity } from './entities/person.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { FilesService } from '../files/files.service';
import { Category } from './entities/category.entity';
import { UploadedFile } from '../common/interceptors';
import { Files } from '../files/files.entity';

@Injectable()
export class PersonsService {
  constructor(
    @InjectRepository(PersonEntity)
    private readonly personRepository: Repository<PersonEntity>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly filesService: FilesService,
  ) {}

  async create(CreatePersonDto: CreatePersonDto): Promise<PersonEntity> {
    const person = new PersonEntity();
    Object.assign(person, CreatePersonDto);

    if (CreatePersonDto.categoryIds?.length) {
      const categories = await this.categoryRepository.findByIds(CreatePersonDto.categoryIds);
      person.categories = categories;
    }
    return this.personRepository.save(person);
  }

  async findAll() {
    return this.personRepository.find({
      relations: ['categories', 'image'],
    });
  }

  async findOne(id: number) {
    const person = await this.personRepository.findOne({
      where: { id },
      relations: ['categories', 'image'],
    });

    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }

    return person;
  }

  async update(id: number, updatePersonDto: Partial<CreatePersonDto>, image?: UploadedFile) {
    const person = await this.findOne(id);

    if (image) {
      if (person.image) {
        await this.filesService.delete(person.image.id);
      }
      const uploadedFile = await this.filesService.upload(image);
      person.image = uploadedFile || null;
    }

    if (updatePersonDto.categoryIds?.length) {
      const categories = await this.categoryRepository.findByIds(updatePersonDto.categoryIds);
      person.categories = categories;
    }

    Object.assign(person, updatePersonDto);
    return this.personRepository.save(person);
  }

  async remove(id: number) {
    const person = await this.findOne(id);
    
    if (person.image) {
      await this.filesService.delete(person.image.id);
    }

    return this.personRepository.remove(person);
  }

  async getFaction(faction: string): Promise<PersonEntity[]> {
    return this.personRepository.findBy({ faction });
  }


}