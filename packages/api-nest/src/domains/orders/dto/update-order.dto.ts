import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ORDER_STATUSES, type OrderStatus } from '../constants/order-status';

export class UpdateOrderDto {
  @ApiProperty({
    description: 'New order status.',
    enum: ORDER_STATUSES,
    example: 'PAID',
  })
  @IsIn(ORDER_STATUSES)
  status: OrderStatus;
}
