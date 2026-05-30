import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'Product UUID to order.',
    format: 'uuid',
    example: '7a2d4b8c-1e3f-4a6b-9c0d-2e4f6a8b0c1d',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description:
      'Quantity of this product. Unit price is snapshotted server-side.',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
