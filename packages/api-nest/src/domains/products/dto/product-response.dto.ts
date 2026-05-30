import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';
import { CategoryResponseDto } from './category-response.dto';

export class ProductResponseDto {
  @ApiProperty({
    description: 'Product UUID.',
    format: 'uuid',
    example: '7a2d4b8c-1e3f-4a6b-9c0d-2e4f6a8b0c1d',
  })
  id: string;

  @ApiProperty({ description: 'Product name.', example: 'iPhone 15' })
  name: string;

  @ApiProperty({ description: 'Unit price.', example: 999.9 })
  price: number;

  @ApiProperty({ description: 'Units in stock.', example: 50 })
  stock: number;

  @ApiProperty({
    description: 'Owning category, or null if uncategorized.',
    type: () => CategoryResponseDto,
    nullable: true,
  })
  category: CategoryResponseDto | null;

  @ApiProperty({
    description: 'When the product was created.',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the product was last updated.',
    format: 'date-time',
  })
  updatedAt: Date;

  static fromEntity(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category
        ? CategoryResponseDto.fromEntity(product.category)
        : null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  static fromEntities(products: Product[]): ProductResponseDto[] {
    return products.map((product) => ProductResponseDto.fromEntity(product));
  }
}
