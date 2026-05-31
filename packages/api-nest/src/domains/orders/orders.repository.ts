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

export interface SalesSummary {
  totalSales: number;
  orderCount: number;
  distinctCustomers: number;
}

export interface MonthlySalesRow {
  month: number;
  total: number;
}

export interface CategorySalesRow {
  categoryName: string;
  revenue: number;
}

export interface TopProductRow {
  productId: string;
  name: string;
  categoryName: string;
  revenue: number;
}

export interface RegionSalesRow {
  state: string;
  revenue: number;
}

export interface LtvByCustomerRow {
  customerId: string;
  ltv: number;
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

  // ---------------------------------------------------------------------------
  // Analytics aggregates.
  //
  // These are the only raw QueryBuilder/getRaw* queries in the codebase. They
  // live here (the sole typeorm layer, per architecture rules) because
  // GROUP BY / SUM / COUNT DISTINCT / date bucketing cannot be expressed with
  // FindOptions. Column transformers (e.g. numericToNumber) do NOT run on raw
  // results, so every numeric/count column is coerced with Number() and a 0
  // fallback (SUM over an empty set returns null).
  //
  // Join discipline (to avoid double-counting via the items fan-out):
  //   - Order-level money  -> join customer only, SUM(order.totalPrice).
  //   - Item-level money   -> join items/product/category, SUM(item.unitPrice * item.quantity).
  // ---------------------------------------------------------------------------

  async getSalesSummary(
    from: Date,
    to: Date,
    statuses: OrderStatus[],
  ): Promise<SalesSummary> {
    const raw = await this.repo
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalPrice), 0)', 'totalSales')
      .addSelect('COUNT(order.id)', 'orderCount')
      .addSelect('COUNT(DISTINCT order.customerId)', 'distinctCustomers')
      .where('order.status IN (:...statuses)', { statuses })
      .andWhere('order.createdAt BETWEEN :from AND :to', { from, to })
      .getRawOne<{
        totalSales: string | null;
        orderCount: string | null;
        distinctCustomers: string | null;
      }>();

    return {
      totalSales: Number(raw?.totalSales) || 0,
      orderCount: Number(raw?.orderCount) || 0,
      distinctCustomers: Number(raw?.distinctCustomers) || 0,
    };
  }

  async getMonthlySales(
    from: Date,
    to: Date,
    statuses: OrderStatus[],
  ): Promise<MonthlySalesRow[]> {
    const rows = await this.repo
      .createQueryBuilder('order')
      .select('EXTRACT(MONTH FROM order.createdAt)', 'month')
      .addSelect('SUM(order.totalPrice)', 'total')
      .where('order.status IN (:...statuses)', { statuses })
      .andWhere('order.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('EXTRACT(MONTH FROM order.createdAt)')
      .orderBy('month', 'ASC')
      .getRawMany<{ month: string; total: string | null }>();

    return rows.map((r) => ({
      month: Number(r.month) || 0,
      total: Number(r.total) || 0,
    }));
  }

  async getSalesByCategory(
    from: Date,
    to: Date,
    statuses: OrderStatus[],
  ): Promise<CategorySalesRow[]> {
    const rows = await this.repo
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .innerJoin('item.product', 'product')
      .leftJoin('product.category', 'category')
      .select("COALESCE(category.name, 'Uncategorized')", 'categoryName')
      .addSelect('SUM(item.unitPrice * item.quantity)', 'revenue')
      .where('order.status IN (:...statuses)', { statuses })
      .andWhere('order.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy("COALESCE(category.name, 'Uncategorized')")
      .orderBy('revenue', 'DESC')
      .getRawMany<{ categoryName: string; revenue: string | null }>();

    return rows.map((r) => ({
      categoryName: r.categoryName,
      revenue: Number(r.revenue) || 0,
    }));
  }

  async getTopProducts(
    from: Date,
    to: Date,
    statuses: OrderStatus[],
    limit: number,
  ): Promise<TopProductRow[]> {
    const rows = await this.repo
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .innerJoin('item.product', 'product')
      .leftJoin('product.category', 'category')
      .select('product.id', 'productId')
      .addSelect('product.name', 'name')
      .addSelect("COALESCE(category.name, 'Uncategorized')", 'categoryName')
      .addSelect('SUM(item.unitPrice * item.quantity)', 'revenue')
      .where('order.status IN (:...statuses)', { statuses })
      .andWhere('order.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy("COALESCE(category.name, 'Uncategorized')")
      .orderBy('revenue', 'DESC')
      .limit(limit)
      .getRawMany<{
        productId: string;
        name: string;
        categoryName: string;
        revenue: string | null;
      }>();

    return rows.map((r) => ({
      productId: r.productId,
      name: r.name,
      categoryName: r.categoryName,
      revenue: Number(r.revenue) || 0,
    }));
  }

  async getSalesByRegion(
    from: Date,
    to: Date,
    statuses: OrderStatus[],
  ): Promise<RegionSalesRow[]> {
    const rows = await this.repo
      .createQueryBuilder('order')
      .innerJoin('order.customer', 'customer')
      .select('customer.state', 'state')
      .addSelect('SUM(order.totalPrice)', 'revenue')
      .where('order.status IN (:...statuses)', { statuses })
      .andWhere('order.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('customer.state')
      .orderBy('revenue', 'DESC')
      .getRawMany<{ state: string; revenue: string | null }>();

    return rows.map((r) => ({
      state: r.state,
      revenue: Number(r.revenue) || 0,
    }));
  }

  async getLtvByCustomer(statuses: OrderStatus[]): Promise<LtvByCustomerRow[]> {
    const rows = await this.repo
      .createQueryBuilder('order')
      .select('order.customerId', 'customerId')
      .addSelect('SUM(order.totalPrice)', 'ltv')
      .where('order.status IN (:...statuses)', { statuses })
      .groupBy('order.customerId')
      .getRawMany<{ customerId: string; ltv: string | null }>();

    return rows.map((r) => ({
      customerId: r.customerId,
      ltv: Number(r.ltv) || 0,
    }));
  }
}
