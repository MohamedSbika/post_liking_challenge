import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Like } from './like.entity';
import { Post } from '../posts/post.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
/* 
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull'; 
*/

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likesRepository: Repository<Like>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    /* 
    @InjectQueue('notifications') 
    private readonly notificationsQueue: Queue 
    */
  ) { }

  async likePost(postId: string, userId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const post = await queryRunner.manager.findOne(Post, {
        where: { id: postId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const existingLike = await queryRunner.manager.findOne(Like, {
        where: { postId, userId },
      });

      if (existingLike) {
        throw new ConflictException('Post already liked by this user');
      }

      const like = queryRunner.manager.create(Like, { postId, userId });
      await queryRunner.manager.save(like);

      post.likesCount += 1;
      await queryRunner.manager.save(post);

      await queryRunner.commitTransaction();

      // Emit event for notification (Active logic)
      this.eventEmitter.emit('post.liked', {
        postId,
        userId,
        authorId: post.authorId,
      });

      /*
      // BullMQ logic (Disabled until enabled)
      await this.notificationsQueue.add('send-like-notification', {
        postId,
        userId,
        authorId: post.authorId,
      });
      */
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
