import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { Product } from '../products/entities/product.entity';
import { DEFAULT_ORDER_STATUS } from './constants/order-status';
import {
  CreateOrderInput,
  OrderItemInput,
  OrdersRepository,
  StockConsumption,
} from './orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { Order } from './entities/order.entity';

export interface PaginatedOrders {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly orders: OrdersRepository,
    private readonly customers: CustomersService,
    private readonly products: ProductsService,
  ) {}

  async getById(id: string): Promise<Order> {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async list(query: QueryOrdersDto): Promise<PaginatedOrders> {
    const { page, limit, ...filters } = query;
    const [data, total] = await this.orders.findAndCount(filters, page, limit);
    return { data, total, page, limit };
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    await this.customers.getById(dto.customerId);

    const consumption = this.aggregate(dto);

    const priceByProduct = new Map<string, number>();
    for (const { productId, quantity } of consumption) {
      const product = await this.loadProduct(productId);
      priceByProduct.set(productId, product.price);
      if (product.stock < quantity) {
        throw new BadRequestException(
          `insufficient stock for product ${productId}`,
        );
      }
    }

    const items: OrderItemInput[] = dto.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: priceByProduct.get(item.productId)!,
    }));
    const totalPrice = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const input: CreateOrderInput = {
      customerId: dto.customerId,
      status: DEFAULT_ORDER_STATUS,
      totalPrice,
      items,
      consumption,
    };

    const created = await this.persist(() =>
      this.orders.createWithItems(input),
    );
    return this.getById(created.id);
  }

  async updateStatus(id: string, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.orders.updateStatus(id, dto.status);
    if (!order) throw new NotFoundException('Order not found');
    return this.getById(id);
  }

  async remove(id: string): Promise<void> {
    const affected = await this.orders.delete(id);
    if (affected === 0) throw new NotFoundException('Order not found');
  }

  async updateItem(
    orderId: string,
    itemId: string,
    dto: UpdateOrderItemDto,
  ): Promise<Order> {
    const item = await this.orders.findItemById(orderId, itemId);
    if (!item) throw new NotFoundException('Order item not found');

    const product = await this.loadProduct(item.productId);
    const delta = dto.quantity - item.quantity;
    if (delta > 0 && product.stock < delta) {
      throw new BadRequestException(
        `insufficient stock for product ${item.productId}`,
      );
    }

    const order = await this.persist(() =>
      this.orders.updateItemQuantity(orderId, itemId, dto.quantity),
    );
    if (!order) throw new NotFoundException('Order item not found');
    return order;
  }

  async removeItem(orderId: string, itemId: string): Promise<void> {
    const deleted = await this.orders.deleteItem(orderId, itemId);
    if (!deleted) throw new NotFoundException('Order item not found');
  }

  private aggregate(dto: CreateOrderDto): StockConsumption[] {
    const byProduct = new Map<string, number>();
    for (const item of dto.items) {
      byProduct.set(
        item.productId,
        (byProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }
    return [...byProduct].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  private async loadProduct(productId: string): Promise<Product> {
    try {
      return await this.products.getById(productId);
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw new BadRequestException(`product ${productId} not found`);
      }
      throw err;
    }
  }

  private async persist<T>(op: () => Promise<T>): Promise<T> {
    try {
      return await op();
    } catch (err) {
      if (err instanceof QueryFailedError) {
        if ((err as { code?: string }).code === '23503') {
          throw new BadRequestException('customer or product not found');
        }
      }
      throw err;
    }
  }
}
