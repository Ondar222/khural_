import { PartialType } from '@nestjs/swagger';
import { CreateSliderItemDto } from './create-slider-item.dto';

export class UpdateSliderItemDto extends PartialType(CreateSliderItemDto) {}

