import { ApiProperty } from '@nestjs/swagger';
import { CategoryResponseDto } from './category-response.dto';

export class PaginatedCategoriesDto {
  @ApiProperty({
    type: [CategoryResponseDto],
    description: 'Categories on the current page.',
  })
  data: CategoryResponseDto[];

  @ApiProperty({
    description: 'Total categories matching the filters (across all pages).',
    example: 42,
  })
  total: number;

  @ApiProperty({ description: 'Current page number (1-based).', example: 1 })
  page: number;

  @ApiProperty({ description: 'Page size.', example: 20 })
  limit: number;
}
