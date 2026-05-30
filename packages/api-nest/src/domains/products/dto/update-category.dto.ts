import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Category name.',
    example: 'Electronics',
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({
    description: 'Category description.',
    example: 'Phones, laptops and accessories.',
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;
}
