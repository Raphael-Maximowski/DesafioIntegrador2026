import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { DEFAULT_LOW_STOCK_THRESHOLD } from '../constants/inventory';

export class QueryProductsDashboardDto {
  @ApiPropertyOptional({
    description:
      'Stock cutoff for the low-stock count. Products with stock strictly below this value are counted as low stock.',
    minimum: 1,
    default: DEFAULT_LOW_STOCK_THRESHOLD,
    example: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lowStockThreshold: number = DEFAULT_LOW_STOCK_THRESHOLD;
}
