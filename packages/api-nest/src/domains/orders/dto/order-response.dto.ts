import { ApiProperty } from '@nestjs/swagger';
import { CustomerResponseDto } from '../../customers/dto/customer-response.dto';
import { ORDER_STATUSES, type OrderStatus } from '../constants/order-status';
import { Order } from '../entities/order.entity';
import { OrderItemResponseDto } from './order-item-response.dto';

export class OrderResponseDto {
  @ApiProperty({
    description: 'Order UUID.',
    format: 'uuid',
    example: '2e4f6a8b-0c1d-7a2d-4b8c-1e3f4a6b9c0d',
  })
  id: string;

  @ApiProperty({
    description: 'Customer who placed the order.',
    type: () => CustomerResponseDto,
  })
  customer: CustomerResponseDto;

  @ApiProperty({
    description: 'Line items on the order.',
    type: [OrderItemResponseDto],
  })
  items: OrderItemResponseDto[];

  @ApiProperty({
    description: 'Order status.',
    enum: ORDER_STATUSES,
    example: 'PENDING',
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Sum of all line totals.',
    example: 1999.8,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'When the order was created.',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the order was last updated.',
    format: 'date-time',
  })
  updatedAt: Date;

  static fromEntity(order: Order): OrderResponseDto {
    return {
      id: order.id,
      customer: CustomerResponseDto.fromEntity(order.customer),
      items: OrderItemResponseDto.fromEntities(order.items ?? []),
      status: order.status,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  static fromEntities(orders: Order[]): OrderResponseDto[] {
    return orders.map((order) => OrderResponseDto.fromEntity(order));
  }
}
