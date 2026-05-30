import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ description: 'Overall status.', example: 'ok' })
  status: string;

  @ApiProperty({ description: 'Service identifier.', example: 'api-nest' })
  service: string;

  @ApiProperty({
    description: 'Connected database name (from `SELECT current_database()`).',
    example: 'app',
  })
  db: string;
}
