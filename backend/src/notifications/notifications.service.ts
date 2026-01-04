import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  @OnEvent('post.liked', { async: true })
  handlePostLikedEvent(payload: {
    postId: string;
    userId: string;
    authorId: string;
  }) {
    const { postId, userId, authorId } = payload;

    this.logger.log(
      `[Notification] User ${userId} liked post ${postId}. Notifying author ${authorId}...`,
    );
  }
}
