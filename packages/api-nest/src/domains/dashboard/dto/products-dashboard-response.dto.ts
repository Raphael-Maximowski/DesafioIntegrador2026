import { ApiProperty } from '@nestjs/swagger';

export class ProductsDashboardResponseDto {
  @ApiProperty({
    description: 'Total units in stock across all products (sum of stock).',
    example: 12450,
  })
  totalStock: number;

  @ApiProperty({
    description:
      'Number of products whose stock is strictly below the low-stock threshold.',
    example: 7,
  })
  lowStockCount: number;

  @ApiProperty({
    description: 'The low-stock cutoff applied to this response.',
    example: 30,
  })
  lowStockThreshold: number;

  @ApiProperty({
    description: 'Total number of categories (all categories are active).',
    example: 12,
  })
  activeCategories: number;

  @ApiProperty({
    description: 'Total value of current stock (sum of price * stock).',
    example: 875320.5,
  })
  totalStockValue: number;
}
