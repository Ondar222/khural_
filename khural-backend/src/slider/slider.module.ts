import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SliderController } from './slider.controller';
import { SliderService } from './slider.service';
import { SliderItemEntity } from './entities/slider-item.entity';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [TypeOrmModule.forFeature([SliderItemEntity]), FilesModule],
  controllers: [SliderController],
  providers: [SliderService],
  exports: [SliderService],
})
export class SliderModule {}

