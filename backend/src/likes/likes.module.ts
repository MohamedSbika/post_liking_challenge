import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './like.entity';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { Post as PostEntity } from '../posts/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Like, PostEntity])],
  providers: [LikesService],
  controllers: [LikesController],
})
export class LikesModule {}
