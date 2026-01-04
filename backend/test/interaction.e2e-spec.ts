import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Post } from '../src/posts/post.entity';
import { Server } from 'http';

describe('Interaction (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let postId: string;
  const userId = 'user-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = app.get(DataSource);

    // Seed a post
    const postRepo = dataSource.getRepository(Post);
    const post = await postRepo.save(
      postRepo.create({
        content: 'Test Post',
        authorId: 'author-1',
      }),
    );
    postId = post.id;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  it('POST /v1/posts/:id/like - should like a post', async () => {
    const server = app.getHttpServer() as Server;
    const response = await request(server)
      .post(`/v1/posts/${postId}/like`)
      .set('x-user-id', userId)
      .expect(200);

    expect(response.body.message).toBe('Post liked successfully');

    const getResponse = await request(server)
      .get(`/v1/posts/${postId}`)
      .expect(200);

    expect((getResponse.body as any).likesCount).toBe(1);
  });

  it('POST /v1/posts/:id/like - should not like twice', async () => {
    const server = app.getHttpServer() as Server;
    await request(server)
      .post(`/v1/posts/${postId}/like`)
      .set('x-user-id', userId)
      .expect(409);
  });

  it('POST /v1/posts/:id/like - should return 401 if x-user-id is missing', async () => {
    const server = app.getHttpServer() as Server;
    await request(server).post(`/v1/posts/${postId}/like`).expect(401);
  });
});
