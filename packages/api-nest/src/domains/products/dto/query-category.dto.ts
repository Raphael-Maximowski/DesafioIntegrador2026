import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryCategoryDto {
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
    example: 'Electro',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by description (substring match).',
    example: 'laptop',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Only categories created on/after this instant.',
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAtFrom?: Date;

  @ApiPropertyOptional({
    description: 'Only categories created on/before this instant.',
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAtTo?: Date;

  @ApiPropertyOptional({
    description: 'Only categories updated on/after this instant.',
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedAtFrom?: Date;

  @ApiPropertyOptional({
    description: 'Only categories updated on/before this instant.',
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedAtTo?: Date;
}
