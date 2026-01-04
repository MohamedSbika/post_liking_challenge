export class PostResponseDto {
  id: string;
  content: string;
  authorId: string;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}
