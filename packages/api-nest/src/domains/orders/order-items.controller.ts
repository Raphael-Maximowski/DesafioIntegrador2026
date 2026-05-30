import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { OrdersService } from './orders.service';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrderResponseDto } from './dto/order-response.dto';

@ApiTags('orders')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid access token.',
  type: ErrorResponseDto,
})
@Controller('orders/:orderId/items')
export class OrderItemsController {
  constructor(private readonly orders: OrdersService) {}

  @Patch(':itemId')
  @ApiOperation({
    summary: "Update a line item's quantity",
    description:
      'Re-snapshots the unit price to the product current price, adjusts stock by the difference, and recomputes the order total. Returns the updated order.',
  })
  @ApiParam({ name: 'orderId', description: 'Order UUID.', format: 'uuid' })
  @ApiParam({ name: 'itemId', description: 'Order item UUID.', format: 'uuid' })
  @ApiOkResponse({ description: 'The updated order.', type: OrderResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Validation failed, malformed UUID, or insufficient stock.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Order item not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Stock changed concurrently and is no longer sufficient.',
    type: ErrorResponseDto,
  })
  async update(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateOrderItemDto,
  ) {
    const order = await this.orders.updateItem(orderId, itemId, dto);
    return OrderResponseDto.fromEntity(order);
  }

  @Delete(':itemId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a line item',
    description:
      'Removes the item, restocks its product, and recomputes the order total.',
  })
  @ApiParam({ name: 'orderId', description: 'Order UUID.', format: 'uuid' })
  @ApiParam({ name: 'itemId', description: 'Order item UUID.', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Order item deleted.' })
  @ApiResponse({
    status: 400,
    description: 'Malformed UUID.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Order item not found.',
    type: ErrorResponseDto,
  })
  remove(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.orders.removeItem(orderId, itemId);
  }
}
