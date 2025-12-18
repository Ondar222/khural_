import {
  Controller,
  Post,
  Body,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TranslationService } from './translation.service';
import { Locale } from '../common/interfaces/localizable.interface';
import { Accountability } from '../common/decorators';
import { IAccountability } from '../lib/types';
import { RolesHelper } from '../common/utils/roles';
import { AuthGuard } from '../common/guards';

@ApiTags('translation')
@Controller('translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  private ensureAdmin(accountability?: IAccountability) {
    if (!accountability || !RolesHelper.isAdmin(accountability.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  @Post('translate')
  @ApiOperation({ summary: 'Перевести текст (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async translate(
    @Accountability() accountability: IAccountability,
    @Body() body: {
      text: string;
      from: Locale;
      to: Locale;
    },
  ) {
    this.ensureAdmin(accountability);
    return {
      original: body.text,
      translated: await this.translationService.translate(
        body.text,
        body.from,
        body.to,
      ),
      from: body.from,
      to: body.to,
    };
  }

  @Post('translate-batch')
  @ApiOperation({ summary: 'Перевести массив текстов (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async translateBatch(
    @Accountability() accountability: IAccountability,
    @Body() body: {
      texts: string[];
      from: Locale;
      to: Locale;
    },
  ) {
    this.ensureAdmin(accountability);
    return {
      originals: body.texts,
      translated: await this.translationService.translateBatch(
        body.texts,
        body.from,
        body.to,
      ),
      from: body.from,
      to: body.to,
    };
  }
}

