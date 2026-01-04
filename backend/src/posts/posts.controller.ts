import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostResponseDto } from './dto/post-response.dto';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('v1/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async create(@Body() createPostDto: CreatePostDto): Promise<PostResponseDto> {
    return this.postsService.create(
      createPostDto.content,
      createPostDto.authorId,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PostResponseDto> {
    return this.postsService.findOne(id);
  }
}
