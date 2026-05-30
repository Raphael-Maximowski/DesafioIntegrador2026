import { ConflictException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  EntityManager,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { OrderStatus } from './constants/order-status';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

export interface OrderFilters {
  customerId?: string;
  status?: OrderStatus;
  totalMin?: number;
  totalMax?: number;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  updatedAtFrom?: Date;
  updatedAtTo?: Date;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface StockConsumption {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  customerId: string;
  status: OrderStatus;
  totalPrice: number;
  items: OrderItemInput[];
  consumption: StockConsumption[];
}

const ORDER_RELATIONS = {
  customer: true,
  items: { product: { category: true } },
} as const;

function range<T extends number | Date>(min?: T, max?: T) {
  if (min !== undefined && max !== undefined) return Between(min, max);
  if (min !== undefined) return MoreThanOrEqual(min);
  if (max !== undefined) return LessThanOrEqual(max);
  return undefined;
}

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findById(id: string): Promise<Order | null> {
    return this.repo.findOne({ where: { id }, relations: ORDER_RELATIONS });
  }

  findItemById(orderId: string, itemId: string): Promise<OrderItem | null> {
    return this.dataSource
      .getRepository(OrderItem)
      .findOne({ where: { id: itemId, orderId } });
  }

  async updateItemQuantity(
    orderId: string,
    itemId: string,
    quantity: number,
  ): Promise<Order | null> {
    return this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(OrderItem, {
        where: { id: itemId, orderId },
      });
      if (!item) return null;

      const product = await manager.findOne(Product, {
        where: { id: item.productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        throw new ConflictException(`product ${item.productId} not found`);
      }

      const delta = quantity - item.quantity;
      if (delta > 0) {
        if (product.stock < delta) {
          throw new ConflictException(
            `insufficient stock for product ${item.productId}`,
          );
        }
        await manager.decrement(Product, { id: product.id }, 'stock', delta);
      } else if (delta < 0) {
        await manager.increment(Product, { id: product.id }, 'stock', -delta);
      }

      item.quantity = quantity;
      item.unitPrice = product.price;
      await manager.save(item);

      await this.recomputeTotal(manager, orderId);
      return manager.findOne(Order, {
        where: { id: orderId },
        relations: ORDER_RELATIONS,
      });
    });
  }

  async deleteItem(orderId: string, itemId: string): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(OrderItem, {
        where: { id: itemId, orderId },
      });
      if (!item) return false;

      await manager.increment(
        Product,
        { id: item.productId },
        'stock',
        item.quantity,
      );
      await manager.remove(item);
      await this.recomputeTotal(manager, orderId);
      return true;
    });
  }

  private async recomputeTotal(
    manager: EntityManager,
    orderId: string,
  ): Promise<void> {
    const items = await manager.find(OrderItem, { where: { orderId } });
    const total = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    await manager.update(Order, { id: orderId }, { totalPrice: total });
  }

  async createWithItems(input: CreateOrderInput): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      for (const { productId, quantity } of input.consumption) {
        const product = await manager.findOne(Product, {
          where: { id: productId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product) {
          throw new ConflictException(`product ${productId} not found`);
        }
        if (product.stock < quantity) {
          throw new ConflictException(
            `insufficient stock for product ${productId}`,
          );
        }
      }

      const order = manager.create(Order, {
        customerId: input.customerId,
        status: input.status,
        totalPrice: input.totalPrice,
        items: input.items.map((item) =>
          manager.create(OrderItem, {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }),
        ),
      });
      const saved = await manager.save(order);

      for (const { productId, quantity } of input.consumption) {
        await manager.decrement(Product, { id: productId }, 'stock', quantity);
      }

      return saved;
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const order = await this.repo.preload({ id, status });
    if (!order) return null;
    return this.repo.save(order);
  }

  async delete(id: string): Promise<number> {
    const result = await this.repo.delete(id);
    return result.affected ?? 0;
  }

  findAndCount(
    filters: OrderFilters,
    page: number,
    limit: number,
  ): Promise<[Order[], number]> {
    const where: FindOptionsWhere<Order> = {};
    if (filters.customerId !== undefined) where.customerId = filters.customerId;
    if (filters.status !== undefined) where.status = filters.status;

    const total = range(filters.totalMin, filters.totalMax);
    if (total) where.totalPrice = total;
    const createdAt = range(filters.createdAtFrom, filters.createdAtTo);
    if (createdAt) where.createdAt = createdAt;
    const updatedAt = range(filters.updatedAtFrom, filters.updatedAtTo);
    if (updatedAt) where.updatedAt = updatedAt;

    return this.repo.findAndCount({
      where,
      relations: ORDER_RELATIONS,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }
}
