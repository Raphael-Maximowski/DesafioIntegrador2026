import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
  const logger = new Logger('Seed');

  if (process.env.NODE_ENV === 'production') {
    logger.error('Refusing to seed: NODE_ENV=production.');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    await app.get(SeederService).run();
  } catch (err) {
    logger.error('Seeding failed.', err as Error);
    await app.close();
    process.exit(1);
  }
  await app.close();
  process.exit(0);
}

void bootstrap();
