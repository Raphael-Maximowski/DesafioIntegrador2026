import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { PaginatedOrdersDto } from './dto/paginated-orders.dto';

@ApiTags('orders')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid access token.',
  type: ErrorResponseDto,
})
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an order',
    description:
      'Creates an order with its line items in a single transaction. Unit prices are snapshotted from the catalog, the total is computed server-side, and product stock is decremented.',
  })
  @ApiCreatedResponse({ description: 'Order created.', type: OrderResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Validation failed, product not found, or insufficient stock.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Stock changed concurrently and is no longer sufficient.',
    type: ErrorResponseDto,
  })
  async create(@Body() dto: CreateOrderDto) {
    const order = await this.orders.create(dto);
    return OrderResponseDto.fromEntity(order);
  }

  @Get()
  @ApiOperation({
    summary: 'List orders',
    description: 'Returns a paginated, optionally-filtered list of orders.',
  })
  @ApiOkResponse({ description: 'Paginated orders.', type: PaginatedOrdersDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters.',
    type: ErrorResponseDto,
  })
  async list(@Query() query: QueryOrdersDto) {
    const { data, total, page, limit } = await this.orders.list(query);
    return {
      data: OrderResponseDto.fromEntities(data),
      total,
      page,
      limit,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by id' })
  @ApiParam({ name: 'id', description: 'Order UUID.', format: 'uuid' })
  @ApiOkResponse({ description: 'The order.', type: OrderResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Malformed UUID.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
    type: ErrorResponseDto,
  })
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.orders.getById(id);
    return OrderResponseDto.fromEntity(order);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update order status',
    description: 'Transitions the order to a new status.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID.', format: 'uuid' })
  @ApiOkResponse({ description: 'The updated order.', type: OrderResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or malformed UUID.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    const order = await this.orders.updateStatus(id, dto);
    return OrderResponseDto.fromEntity(order);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an order' })
  @ApiParam({ name: 'id', description: 'Order UUID.', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Order deleted.' })
  @ApiResponse({
    status: 400,
    description: 'Malformed UUID.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
    type: ErrorResponseDto,
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.remove(id);
  }
}
