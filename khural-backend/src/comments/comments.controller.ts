import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentEntityType } from './entities/comment.entity';
import { Accountability } from '../common/decorators';
import { IAccountability } from '../lib/types';
import { RolesHelper } from '../common/utils/roles';
import { AuthGuard } from '../common/guards';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  private ensureAdmin(accountability?: IAccountability) {
    if (!accountability || !RolesHelper.isAdmin(accountability.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать новый комментарий (требуется авторизация)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async create(
    @Accountability() accountability: IAccountability,
    @Body() body: CreateCommentDto,
  ) {
    if (!accountability?.user) {
      throw new ForbiddenException('Требуется авторизация');
    }
    return this.commentsService.create(body, accountability.user);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список комментариев' })
  @ApiQuery({ name: 'entityType', required: true, enum: CommentEntityType })
  @ApiQuery({ name: 'entityId', required: true, type: Number })
  @ApiQuery({ name: 'onlyApproved', required: false, type: Boolean })
  @ApiQuery({ name: 'includeReplies', required: false, type: Boolean })
  async findAll(
    @Query('entityType') entityType: CommentEntityType,
    @Query('entityId', ParseIntPipe) entityId: number,
    @Query('onlyApproved') onlyApproved?: string,
    @Query('includeReplies') includeReplies?: string,
  ) {
    return this.commentsService.findAll(entityType, entityId, {
      onlyApproved: onlyApproved !== 'false',
      includeReplies: includeReplies === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить детальную информацию о комментарии' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.findOne(id);
  }

  @Get(':id/replies')
  @ApiOperation({ summary: 'Получить ответы на комментарий' })
  async getReplies(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.getReplies(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Одобрить/отклонить комментарий (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
    @Body() body: { approved: boolean },
  ) {
    this.ensureAdmin(accountability);
    
    if (!accountability.user) {
      throw new ForbiddenException('User ID not found');
    }
    
    return this.commentsService.approve(id, accountability.user, body.approved);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить комментарий (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    await this.commentsService.delete(id);
  }
}

