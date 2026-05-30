import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Product name.',
    example: 'iPhone 15',
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({
    description: 'Unit price (max 2 decimal places).',
    example: 999.9,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Units in stock.',
    example: 50,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    description:
      'Owning category UUID. Pass `null` to detach this product from its category.',
    format: 'uuid',
    nullable: true,
    example: '3f6c1a9e-9c2b-4f1a-bd4e-2a1c9d8e7f00',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;
}
