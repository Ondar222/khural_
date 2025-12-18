import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EsiaService } from './esia.service';

@ApiTags('esia')
@Controller('esia')
export class EsiaController {
  constructor(private readonly esiaService: EsiaService) {}

  @Get('auth')
  @ApiOperation({ summary: 'Авторизация через ЕСИА (заглушка)' })
  @ApiQuery({ name: 'code', required: false })
  @ApiQuery({ name: 'state', required: false })
  async auth(@Query('code') code?: string, @Query('state') state?: string) {
    // Заглушка - будет реализована при получении доступа к API ЕСИА
    return {
      message: 'ESIA integration not yet implemented. Waiting for API access.',
      code,
      state,
    };
  }

  @Get('callback')
  @ApiOperation({ summary: 'Callback от ЕСИА (заглушка)' })
  async callback() {
    return {
      message: 'ESIA callback endpoint. Will be implemented when API access is granted.',
    };
  }
}

