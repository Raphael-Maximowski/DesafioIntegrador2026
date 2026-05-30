import { ApiProperty } from '@nestjs/swagger';
import { ProductResponseDto } from './product-response.dto';

export class PaginatedProductsDto {
  @ApiProperty({
    type: [ProductResponseDto],
    description: 'Products on the current page.',
  })
  data: ProductResponseDto[];

  @ApiProperty({
    description: 'Total products matching the filters (across all pages).',
    example: 42,
  })
  total: number;

  @ApiProperty({ description: 'Current page number (1-based).', example: 1 })
  page: number;

  @ApiProperty({ description: 'Page size.', example: 20 })
  limit: number;
}
