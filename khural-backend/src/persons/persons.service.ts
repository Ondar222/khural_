import { Injectable, NotFoundException, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PersonEntity } from './entities/person.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { FilesService } from '../files/files.service';
import { Category } from './entities/category.entity';
import { UploadedFile } from '../common/interceptors';
import { Files } from '../files/files.entity';
import { DeclarationEntity, DeclarationType } from './entities/declaration.entity';
import { Faction } from './entities/faction.entity';
import { District } from './entities/district.entity';
import { Convocation } from './entities/convocation.entity';

@Injectable()
export class PersonsService {
  constructor(
    @InjectRepository(PersonEntity)
    private readonly personRepository: Repository<PersonEntity>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(DeclarationEntity)
    private readonly declarationRepository: Repository<DeclarationEntity>,
    @InjectRepository(Faction)
    private readonly factionRepository: Repository<Faction>,
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
    @InjectRepository(Convocation)
    private readonly convocationRepository: Repository<Convocation>,
    private readonly filesService: FilesService,
  ) {}

  async create(CreatePersonDto: CreatePersonDto): Promise<PersonEntity> {
    const person = new PersonEntity();
    
    // Конвертируем timestamp (number) в Date
    const personData = { ...CreatePersonDto };
    if (personData.dateOfBirth) {
      personData.dateOfBirth = new Date(personData.dateOfBirth) as any;
    }
    if (personData.startDate) {
      personData.startDate = new Date(personData.startDate) as any;
    }
    
    Object.assign(person, personData);

    if (CreatePersonDto.categoryIds?.length) {
      const categories = await this.categoryRepository.find({
        where: { id: In(CreatePersonDto.categoryIds.map(id => parseInt(id))) },
      });
      person.categories = categories;
    }

    if (CreatePersonDto.factionIds?.length) {
      const factions = await this.factionRepository.find({
        where: { id: In(CreatePersonDto.factionIds.map(id => parseInt(id))) },
      });
      person.factions = factions;
    }

    if (CreatePersonDto.districtIds?.length) {
      const districts = await this.districtRepository.find({
        where: { id: In(CreatePersonDto.districtIds.map(id => parseInt(id))) },
      });
      person.districts = districts;
    }

    if (CreatePersonDto.convocationIds?.length) {
      const convocations = await this.convocationRepository.find({
        where: { id: In(CreatePersonDto.convocationIds.map(id => parseInt(id))) },
      });
      person.convocations = convocations;
    }
    
    const savedPerson = await this.personRepository.save(person);
    
    // Загружаем полные данные с relations для корректного возврата
    return this.findOne(savedPerson.id);
  }

  async findAll(filters?: {
    districtId?: number;
    convocationId?: number;
    factionId?: number;
  }) {
    const queryBuilder = this.personRepository.createQueryBuilder('person')
      .leftJoinAndSelect('person.categories', 'categories')
      .leftJoinAndSelect('person.factions', 'factions')
      .leftJoinAndSelect('person.districts', 'districts')
      .leftJoinAndSelect('person.convocations', 'convocations')
      .leftJoinAndSelect('person.image', 'image')
      .leftJoinAndSelect('person.declarations', 'declarations')
      .leftJoinAndSelect('declarations.pdfFile', 'pdfFile');
    
    if (filters?.districtId) {
      queryBuilder.andWhere('districts.id = :districtId', { districtId: filters.districtId });
    }
    if (filters?.convocationId) {
      queryBuilder.andWhere('convocations.id = :convocationId', { convocationId: filters.convocationId });
    }
    if (filters?.factionId) {
      queryBuilder.andWhere('factions.id = :factionId', { factionId: filters.factionId });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number) {
    const person = await this.personRepository.findOne({
      where: { id },
      relations: ['categories', 'factions', 'districts', 'convocations', 'image', 'declarations', 'declarations.pdfFile'],
    });

    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }

    return person;
  }

  async update(id: number, updatePersonDto: UpdatePersonDto, image?: UploadedFile) {
    const person = await this.findOne(id);

    if (image) {
      if (person.image?.id) {
        await this.filesService.delete(person.image.id);
      }
      const uploadedFile = await this.filesService.upload(image);
      person.image = uploadedFile || null;
    }

    if (updatePersonDto.categoryIds?.length) {
      const categories = await this.categoryRepository.find({
        where: { id: In(updatePersonDto.categoryIds.map(id => parseInt(id))) },
      });
      person.categories = categories;
    }

    if (updatePersonDto.factionIds?.length) {
      const factions = await this.factionRepository.find({
        where: { id: In(updatePersonDto.factionIds.map(id => parseInt(id))) },
      });
      person.factions = factions;
    }

    if (updatePersonDto.districtIds?.length) {
      const districts = await this.districtRepository.find({
        where: { id: In(updatePersonDto.districtIds.map(id => parseInt(id))) },
      });
      person.districts = districts;
    }

    if (updatePersonDto.convocationIds?.length) {
      const convocations = await this.convocationRepository.find({
        where: { id: In(updatePersonDto.convocationIds.map(id => parseInt(id))) },
      });
      person.convocations = convocations;
    }

    // Remove IDs from DTO before assigning
    const { categoryIds, factionIds, districtIds, convocationIds, ...updateData } = updatePersonDto;
    
    // Конвертируем timestamp (number) в Date
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth as any) as any;
    }
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate as any) as any;
    }
    
    Object.assign(person, updateData);
    const savedPerson = await this.personRepository.save(person);
    
    // Загружаем полные данные с relations для корректного возврата
    return this.findOne(savedPerson.id);
  }

  async remove(id: number) {
    const person = await this.findOne(id);
    
    // Delete declarations and their PDF files
    if (person.declarations) {
      for (const declaration of person.declarations) {
        if (declaration.pdfFile?.id) {
          await this.filesService.delete(declaration.pdfFile.id);
        }
        await this.declarationRepository.remove(declaration);
      }
    }

    // Delete person's image
    if (person.image?.id) {
      await this.filesService.delete(person.image.id);
    }

    return this.personRepository.remove(person);
  }


  async addDeclaration(
    personId: number,
    type: DeclarationType,
    pdfFile: UploadedFile,
    year?: string,
    description?: string,
  ): Promise<DeclarationEntity> {
    const person = await this.findOne(personId);
    
    // Проверяем, что загружен PDF файл
    if (pdfFile.type && pdfFile.type !== 'application/pdf') {
      throw new NotFoundException('Допускается только загрузка PDF файлов');
    }
    
    // Проверяем расширение файла
    if (pdfFile.filename_download && !pdfFile.filename_download.toLowerCase().endsWith('.pdf')) {
      throw new NotFoundException('Допускается только загрузка PDF файлов');
    }
    
    const uploadedFile = await this.filesService.upload(pdfFile);
    
    if (!uploadedFile) {
      throw new NotFoundException('Не удалось загрузить PDF файл');
    }
    
    const declaration = this.declarationRepository.create({
      person,
      type,
      year,
      description,
      pdfFile: uploadedFile,
    });

    const savedDeclaration = await this.declarationRepository.save(declaration);
    
    // Загружаем декларацию с relations для корректного возврата
    const declarationWithFile = await this.declarationRepository.findOne({
      where: { id: savedDeclaration.id },
      relations: ['pdfFile'],
    });
    
    return declarationWithFile || savedDeclaration;
  }

  async getDeclarations(personId: number): Promise<DeclarationEntity[]> {
    return this.declarationRepository.find({
      where: { person: { id: personId } },
      relations: ['pdfFile'],
    });
  }

  async deleteDeclaration(declarationId: number): Promise<void> {
    const declaration = await this.declarationRepository.findOne({
      where: { id: declarationId },
      relations: ['pdfFile'],
    });

    if (!declaration) {
      throw new NotFoundException(`Declaration with ID ${declarationId} not found`);
    }

    if (declaration.pdfFile?.id) {
      await this.filesService.delete(declaration.pdfFile.id);
    }

    await this.declarationRepository.remove(declaration);
  }

  async getAllCategories(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

  async createCategory(name: string): Promise<Category> {
    const category = this.categoryRepository.create({ name });
    return this.categoryRepository.save(category);
  }

  // CRUD для фракций
  async getAllFactions(): Promise<Faction[]> {
    return this.factionRepository.find();
  }

  async createFaction(name: string): Promise<Faction> {
    const faction = this.factionRepository.create({ name });
    return this.factionRepository.save(faction);
  }

  async updateFaction(id: number, name: string): Promise<Faction> {
    const faction = await this.factionRepository.findOne({ where: { id } });
    if (!faction) {
      throw new NotFoundException(`Faction with ID ${id} not found`);
    }
    faction.name = name;
    return this.factionRepository.save(faction);
  }

  async deleteFaction(id: number): Promise<void> {
    const faction = await this.factionRepository.findOne({ where: { id } });
    if (!faction) {
      throw new NotFoundException(`Faction with ID ${id} not found`);
    }
    await this.factionRepository.remove(faction);
  }

  // CRUD для округов
  async getAllDistricts(): Promise<District[]> {
    return this.districtRepository.find();
  }

  async createDistrict(name: string): Promise<District> {
    const district = this.districtRepository.create({ name });
    return this.districtRepository.save(district);
  }

  async updateDistrict(id: number, name: string): Promise<District> {
    const district = await this.districtRepository.findOne({ where: { id } });
    if (!district) {
      throw new NotFoundException(`District with ID ${id} not found`);
    }
    district.name = name;
    return this.districtRepository.save(district);
  }

  async deleteDistrict(id: number): Promise<void> {
    const district = await this.districtRepository.findOne({ where: { id } });
    if (!district) {
      throw new NotFoundException(`District with ID ${id} not found`);
    }
    await this.districtRepository.remove(district);
  }

  // CRUD для созывов
  async getAllConvocations(): Promise<Convocation[]> {
    return this.convocationRepository.find();
  }

  async createConvocation(name: string): Promise<Convocation> {
    const convocation = this.convocationRepository.create({ name });
    return this.convocationRepository.save(convocation);
  }

  async updateConvocation(id: number, name: string): Promise<Convocation> {
    const convocation = await this.convocationRepository.findOne({ where: { id } });
    if (!convocation) {
      throw new NotFoundException(`Convocation with ID ${id} not found`);
    }
    convocation.name = name;
    return this.convocationRepository.save(convocation);
  }

  async deleteConvocation(id: number): Promise<void> {
    const convocation = await this.convocationRepository.findOne({ where: { id } });
    if (!convocation) {
      throw new NotFoundException(`Convocation with ID ${id} not found`);
    }
    await this.convocationRepository.remove(convocation);
  }
}