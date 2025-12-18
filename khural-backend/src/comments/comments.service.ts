import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity, CommentEntityType } from './entities/comment.entity';
import { User } from '../user/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NewsEntity } from '../news/entities/news.entity';
import { DocumentEntity } from '../documents/entities/document.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(NewsEntity)
    private readonly newsRepository: Repository<NewsEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
  ) {}

  async create(dto: CreateCommentDto, userId: string): Promise<CommentEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Проверяем существование сущности
    await this.validateEntity(dto.entityType, dto.entityId);

    let parentComment: CommentEntity | null = null;
    if (dto.parentCommentId) {
      parentComment = await this.commentRepository.findOne({
        where: { id: dto.parentCommentId },
      });
      if (!parentComment) {
        throw new NotFoundException(
          `Parent comment with ID ${dto.parentCommentId} not found`,
        );
      }

      // Проверяем, что родительский комментарий относится к той же сущности
      if (
        parentComment.entityType !== dto.entityType ||
        parentComment.entityId !== dto.entityId
      ) {
        throw new BadRequestException(
          'Parent comment must belong to the same entity',
        );
      }
    }

    const comment = this.commentRepository.create({
      user,
      content: dto.content,
      parentComment,
      entityType: dto.entityType,
      entityId: dto.entityId,
      isApproved: false, // По умолчанию требует модерации
      isModerated: false,
    });

    return this.commentRepository.save(comment);
  }

  async findAll(
    entityType: CommentEntityType,
    entityId: number,
    filters?: {
      onlyApproved?: boolean;
      includeReplies?: boolean;
    },
  ): Promise<CommentEntity[]> {
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.entityType = :entityType', { entityType })
      .andWhere('comment.entityId = :entityId', { entityId });

    if (filters?.onlyApproved !== false) {
      queryBuilder.andWhere('comment.isApproved = :isApproved', {
        isApproved: true,
      });
    }

    // Показываем только корневые комментарии (без родителя)
    if (filters?.includeReplies !== true) {
      queryBuilder.andWhere('comment.parentComment IS NULL');
    }

    queryBuilder.orderBy('comment.createdAt', 'DESC');

    const comments = await queryBuilder.getMany();

    // Если нужно включить ответы, загружаем их для каждого комментария
    if (filters?.includeReplies === true) {
      for (const comment of comments) {
        comment.replies = await this.commentRepository.find({
          where: { parentComment: { id: comment.id } },
          relations: ['user'],
          order: { createdAt: 'ASC' },
        });
      }
    }

    return comments;
  }

  async findOne(id: number): Promise<CommentEntity> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user', 'parentComment', 'moderator'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async approve(
    id: number,
    moderatorId: string,
    approved: boolean = true,
  ): Promise<CommentEntity> {
    const comment = await this.findOne(id);

    const moderator = await this.userRepository.findOne({
      where: { id: moderatorId },
    });
    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${moderatorId} not found`);
    }

    comment.isApproved = approved;
    comment.isModerated = true;
    comment.moderator = moderator;

    return this.commentRepository.save(comment);
  }

  async delete(id: number): Promise<void> {
    const comment = await this.findOne(id);

    // Проверяем, есть ли ответы
    const repliesCount = await this.commentRepository.count({
      where: { parentComment: { id: comment.id } },
    });

    if (repliesCount > 0) {
      throw new BadRequestException(
        'Cannot delete comment with replies. Delete replies first.',
      );
    }

    await this.commentRepository.remove(comment);
  }

  async getReplies(commentId: number): Promise<CommentEntity[]> {
    return this.commentRepository.find({
      where: { parentComment: { id: commentId } },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  private async validateEntity(
    entityType: CommentEntityType,
    entityId: number,
  ): Promise<void> {
    if (entityType === CommentEntityType.NEWS) {
      const news = await this.newsRepository.findOne({
        where: { id: entityId },
      });
      if (!news) {
        throw new NotFoundException(`News with ID ${entityId} not found`);
      }
    } else if (entityType === CommentEntityType.DOCUMENT) {
      const document = await this.documentRepository.findOne({
        where: { id: entityId },
      });
      if (!document) {
        throw new NotFoundException(
          `Document with ID ${entityId} not found`,
        );
      }
    } else {
      throw new BadRequestException(`Invalid entity type: ${entityType}`);
    }
  }
}

