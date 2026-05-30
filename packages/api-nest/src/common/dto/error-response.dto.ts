import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ description: 'HTTP status code.', example: 404 })
  statusCode: number;

  @ApiProperty({
    description: 'Human-readable status name.',
    example: 'Not Found',
  })
  error: string;

  @ApiProperty({
    description:
      'Client-safe message. May be a string or an array of validation messages.',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Customer not found',
  })
  message: string | string[];

  @ApiProperty({
    description: 'ISO timestamp of when the error was produced.',
    example: '2026-05-30T12:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path that produced the error.',
    example: '/api/customers/abc',
  })
  path: string;
}
