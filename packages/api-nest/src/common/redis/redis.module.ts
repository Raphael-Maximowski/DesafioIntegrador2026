import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import Redis from 'ioredis';

export const REDIS = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: () =>
        new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379/2'),
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnModuleDestroy {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onModuleDestroy() {
    const client = this.moduleRef.get<Redis>(REDIS);
    await client.quit();
  }
}
