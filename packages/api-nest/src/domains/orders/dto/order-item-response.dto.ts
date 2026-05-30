import { ApiProperty } from '@nestjs/swagger';
import { ProductResponseDto } from '../../products/dto/product-response.dto';
import { OrderItem } from '../entities/order-item.entity';

export class OrderItemResponseDto {
  @ApiProperty({
    description: 'Order item UUID.',
    format: 'uuid',
    example: '9c0d2e4f-6a8b-0c1d-7a2d-4b8c1e3f4a6b',
  })
  id: string;

  @ApiProperty({
    description: 'Ordered product. Null if the product was deleted.',
    type: () => ProductResponseDto,
    nullable: true,
  })
  product: ProductResponseDto | null;

  @ApiProperty({ description: 'Ordered quantity.', example: 2 })
  quantity: number;

  @ApiProperty({
    description: 'Unit price snapshotted at order time.',
    example: 999.9,
  })
  unitPrice: number;

  @ApiProperty({
    description: 'Line total (unitPrice × quantity).',
    example: 1999.8,
  })
  lineTotal: number;

  static fromEntity(item: OrderItem): OrderItemResponseDto {
    return {
      id: item.id,
      product: item.product
        ? ProductResponseDto.fromEntity(item.product)
        : null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.quantity,
    };
  }

  static fromEntities(items: OrderItem[]): OrderItemResponseDto[] {
    return items.map((item) => OrderItemResponseDto.fromEntity(item));
  }
}
