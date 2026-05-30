import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name.',
    example: 'iPhone 15',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description: 'Unit price (max 2 decimal places).',
    example: 999.9,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Units in stock.',
    example: 50,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    description: 'Owning category UUID. Omit for an uncategorized product.',
    format: 'uuid',
    example: '3f6c1a9e-9c2b-4f1a-bd4e-2a1c9d8e7f00',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
