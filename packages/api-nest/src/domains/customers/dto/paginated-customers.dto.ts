import { ApiProperty } from '@nestjs/swagger';
import { CustomerResponseDto } from './customer-response.dto';

export class PaginatedCustomersDto {
  @ApiProperty({
    type: [CustomerResponseDto],
    description: 'Customers on the current page.',
  })
  data: CustomerResponseDto[];

  @ApiProperty({
    description: 'Total customers matching the filters (across all pages).',
    example: 42,
  })
  total: number;

  @ApiProperty({ description: 'Current page number (1-based).', example: 1 })
  page: number;

  @ApiProperty({ description: 'Page size.', example: 20 })
  limit: number;
}
