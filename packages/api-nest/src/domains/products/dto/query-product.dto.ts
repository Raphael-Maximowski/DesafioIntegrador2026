import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class QueryProductDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based).',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Page size.',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by name (substring match).',
    example: 'iPhone',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Minimum price (inclusive).',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum price (inclusive).',
    example: 500,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({
    description: 'Minimum stock (inclusive).',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum stock (inclusive).',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockMax?: number;

  @ApiPropertyOptional({
    description: 'Filter by owning category UUID.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description:
      'When true, return only uncategorized products. Overrides categoryId.',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  uncategorized?: boolean;

  @ApiPropertyOptional({
    description: 'Only products created on/after this instant.',
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAtFrom?: Date;

  @ApiPropertyOptional({
    description: 'Only products created on/before this instant.',
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAtTo?: Date;

  @ApiPropertyOptional({
    description: 'Only products updated on/after this instant.',
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedAtFrom?: Date;

  @ApiPropertyOptional({
    description: 'Only products updated on/before this instant.',
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedAtTo?: Date;
}
