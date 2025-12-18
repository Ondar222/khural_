import { Controller, Get, ForbiddenException, UseGuards, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import * as Express from 'express';

import { AuthGuard } from '../common/guards';
import { Accountability } from '../common/decorators';
import { IAccountability } from '../lib/types';
import { RolesHelper } from '../common/utils/roles';

@ApiTags('docs')
@Controller('docs')
export class DocsController {
  private ensureAdmin(accountability?: IAccountability) {
    if (!accountability || !RolesHelper.isAdmin(accountability.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  @Get('env')
  @ApiOperation({ summary: 'ENV_VARIABLES.md (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  getEnvDoc(
    @Accountability() accountability: IAccountability,
    @Res() res: Express.Response,
  ) {
    this.ensureAdmin(accountability);
    const filePath = path.resolve(process.cwd(), 'ENV_VARIABLES.md');
    const md = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    return res.send(md);
  }
}

