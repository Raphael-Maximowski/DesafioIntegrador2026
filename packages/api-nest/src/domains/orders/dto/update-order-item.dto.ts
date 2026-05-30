import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateOrderItemDto {
  @ApiProperty({
    description:
      'New quantity. The unit price is re-snapshotted to the product current price, and stock is adjusted by the difference.',
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
