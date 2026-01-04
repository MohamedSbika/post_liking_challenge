import { Test, TestingModule } from '@nestjs/testing';
import { LikesService } from './likes.service';
import { Like } from './like.entity';
import { Post as PostEntity } from '../posts/post.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('LikesService', () => {
  let service: LikesService;
  let queryRunner: Partial<QueryRunner>;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      } as any,
    };

    const dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        {
          provide: getRepositoryToken(Like),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should like a post successfully', async () => {
    const postId = 'post-1';
    const userId = 'user-1';
    const post = { id: postId, authorId: 'author-1', likesCount: 0 };

    (queryRunner.manager!.findOne as jest.Mock)
      .mockResolvedValueOnce(post)
      .mockResolvedValueOnce(null);

    await service.likePost(postId, userId);

    expect(queryRunner.manager!.save).toHaveBeenCalledTimes(2);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'post.liked',
      expect.any(Object),
    );
  });

  it('should throw NotFoundException if post does not exist', async () => {
    (queryRunner.manager!.findOne as jest.Mock).mockResolvedValueOnce(null);

    await expect(service.likePost('non-existent', 'user-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('should throw ConflictException if post is already liked', async () => {
    const postId = 'post-1';
    const userId = 'user-1';
    const post = { id: postId, authorId: 'author-1', likesCount: 0 };

    (queryRunner.manager!.findOne as jest.Mock)
      .mockResolvedValueOnce(post)
      .mockResolvedValueOnce({ id: 'like-1' });

    await expect(service.likePost(postId, userId)).rejects.toThrow(
      ConflictException,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });
});
