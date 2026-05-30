import { ApiProperty } from '@nestjs/swagger';
import { OrderResponseDto } from './order-response.dto';

export class PaginatedOrdersDto {
  @ApiProperty({
    type: [OrderResponseDto],
    description: 'Orders on the current page.',
  })
  data: OrderResponseDto[];

  @ApiProperty({
    description: 'Total orders matching the filters (across all pages).',
    example: 42,
  })
  total: number;

  @ApiProperty({ description: 'Current page number (1-based).', example: 1 })
  page: number;

  @ApiProperty({ description: 'Page size.', example: 20 })
  limit: number;
}
