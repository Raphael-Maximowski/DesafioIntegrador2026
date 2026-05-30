import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';
import { Public } from './common/auth/public.decorator';

@Public()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async health() {
    const [{ db }] = await this.dataSource.query<Array<{ db: string }>>(
      'SELECT current_database() AS db',
    );
    return { status: 'ok', service: 'api-nest', db };
  }
}
