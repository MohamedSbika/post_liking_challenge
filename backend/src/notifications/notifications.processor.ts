/*
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  @Process('send-like-notification')
  async handleLikeNotification(job: Job) {
    const { postId, userId, authorId } = job.data;
    
    this.logger.log(
      `[BullMQ] Processing notification for post ${postId} by user ${userId}. Notifying ${authorId}...`,
    );

    // Simulation d'un traitement lourd
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    this.logger.log(`[BullMQ] Notification sent successfully for post ${postId}`);
  }
}
*/
