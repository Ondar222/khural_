import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentEntity } from './entities/comment.entity';
import { User } from '../user/user.entity';
import { NewsEntity } from '../news/entities/news.entity';
import { DocumentEntity } from '../documents/entities/document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommentEntity,
      User,
      NewsEntity,
      DocumentEntity,
    ]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}

