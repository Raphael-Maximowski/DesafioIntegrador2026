import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../entities/category.entity';

export class CategoryResponseDto {
  @ApiProperty({
    description: 'Category UUID.',
    format: 'uuid',
    example: '3f6c1a9e-9c2b-4f1a-bd4e-2a1c9d8e7f00',
  })
  id: string;

  @ApiProperty({ description: 'Category name.', example: 'Electronics' })
  name: string;

  @ApiProperty({
    description: 'Category description.',
    example: 'Phones, laptops and accessories.',
  })
  description: string;

  @ApiProperty({
    description: 'When the category was created.',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the category was last updated.',
    format: 'date-time',
  })
  updatedAt: Date;

  static fromEntity(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  static fromEntities(categories: Category[]): CategoryResponseDto[] {
    return categories.map((category) =>
      CategoryResponseDto.fromEntity(category),
    );
  }
}
