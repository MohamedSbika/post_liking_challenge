import {
  Controller,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('v1/posts')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':id/like')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async like(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    const userId = req.user.id;
    await this.likesService.likePost(id, userId);
    return { message: 'Post liked successfully' };
  }
}
