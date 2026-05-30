import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';
import { Public } from './common/auth/public.decorator';
import { HealthResponseDto } from './common/dto/health-response.dto';

@ApiTags('health')
@Public()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Root greeting',
    description: 'Trivial liveness ping returning a fixed greeting string.',
  })
  @ApiOkResponse({ description: 'Greeting string.', type: String })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description:
      'Reports service status and the connected database name (verifies DB connectivity).',
  })
  @ApiOkResponse({
    description: 'Service is up and the database responded.',
    type: HealthResponseDto,
  })
  async health() {
    const [{ db }] = await this.dataSource.query<Array<{ db: string }>>(
      'SELECT current_database() AS db',
    );
    return { status: 'ok', service: 'api-nest', db };
  }
}
