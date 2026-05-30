import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name.',
    example: 'Electronics',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description: 'Category description.',
    example: 'Phones, laptops and accessories.',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  description: string;
}
