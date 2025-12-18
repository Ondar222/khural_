import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SliderItemEntity } from './entities/slider-item.entity';
import { CreateSliderItemDto } from './dto/create-slider-item.dto';
import { UpdateSliderItemDto } from './dto/update-slider-item.dto';
import { FilesService } from '../files/files.service';
import { Files } from '../files/files.entity';

@Injectable()
export class SliderService {
  constructor(
    @InjectRepository(SliderItemEntity)
    private readonly sliderRepository: Repository<SliderItemEntity>,
    private readonly filesService: FilesService,
  ) {}

  async create(dto: CreateSliderItemDto): Promise<SliderItemEntity> {
    // Проверяем количество активных слайдов (максимум 5)
    const activeCount = await this.sliderRepository.count({
      where: { isActive: true },
    });

    if (dto.isActive !== false && activeCount >= 5) {
      throw new BadRequestException(
        'Максимальное количество активных слайдов - 5',
      );
    }

    let image: Files | null = null;
    if (dto.imageId) {
      try {
        image = await this.filesService.findOne(dto.imageId);
      } catch (error) {
        throw new NotFoundException(`Image with ID ${dto.imageId} not found`);
      }
    }

    const sliderItem = this.sliderRepository.create({
      title: dto.title,
      description: dto.description,
      buttonText: dto.buttonText,
      buttonLink: dto.buttonLink,
      image,
      order: dto.order ?? 0,
      isActive: dto.isActive ?? true,
      autoRotateInterval: dto.autoRotateInterval ?? null,
    });

    const savedItem = await this.sliderRepository.save(sliderItem);
    return this.findOne(savedItem.id);
  }

  async findAll(onlyActive: boolean = true): Promise<SliderItemEntity[]> {
    const where = onlyActive ? { isActive: true } : {};
    return this.sliderRepository.find({
      where,
      relations: ['image'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<SliderItemEntity> {
    const item = await this.sliderRepository.findOne({
      where: { id },
      relations: ['image'],
    });

    if (!item) {
      throw new NotFoundException(`Slider item with ID ${id} not found`);
    }

    return item;
  }

  async update(
    id: number,
    dto: UpdateSliderItemDto,
  ): Promise<SliderItemEntity> {
    const item = await this.findOne(id);

    // Проверяем количество активных слайдов при активации
    if (dto.isActive === true && !item.isActive) {
      const activeCount = await this.sliderRepository.count({
        where: { isActive: true },
      });
      if (activeCount >= 5) {
        throw new BadRequestException(
          'Максимальное количество активных слайдов - 5',
        );
      }
    }

    if (dto.imageId !== undefined) {
      if (dto.imageId === null) {
        item.image = null;
      } else {
        try {
          item.image = await this.filesService.findOne(dto.imageId);
        } catch (error) {
          throw new NotFoundException(
            `Image with ID ${dto.imageId} not found`,
          );
        }
      }
    }

    Object.assign(item, {
      title: dto.title ?? item.title,
      description: dto.description ?? item.description,
      buttonText: dto.buttonText ?? item.buttonText,
      buttonLink: dto.buttonLink ?? item.buttonLink,
      order: dto.order ?? item.order,
      isActive: dto.isActive ?? item.isActive,
      autoRotateInterval:
        dto.autoRotateInterval !== undefined
          ? dto.autoRotateInterval
          : item.autoRotateInterval,
    });

    const savedItem = await this.sliderRepository.save(item);
    return this.findOne(savedItem.id);
  }

  async delete(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.sliderRepository.remove(item);
  }

  async reorder(ids: number[]): Promise<SliderItemEntity[]> {
    const items = await this.sliderRepository.find({
      where: ids.map((id) => ({ id })),
    });

    if (items.length !== ids.length) {
      throw new NotFoundException('Some slider items not found');
    }

    items.forEach((item, index) => {
      item.order = ids.indexOf(item.id);
    });

    await this.sliderRepository.save(items);
    return this.findAll(false);
  }
}

