import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { fakerPT_BR as faker } from '@faker-js/faker';
import { Customer } from '../domains/customers/entities/customer.entity';
import { Category } from '../domains/products/entities/category.entity';
import { Product } from '../domains/products/entities/product.entity';
import { Order } from '../domains/orders/entities/order.entity';
import { OrderItem } from '../domains/orders/entities/order-item.entity';
import { SEED_CONFIG, STATUS_WEIGHTS } from './seed.config';
import { makeCategory } from './factories/category.factory';
import { makeProduct } from './factories/product.factory';
import { makeCustomer } from './factories/customer.factory';
import { makeOrder, SeedProduct } from './factories/order.factory';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
  ) {}

  async run(): Promise<void> {
    faker.seed(SEED_CONFIG.fakerSeed);

    await this.truncate();
    const categoryIds = await this.seedCategories();
    const products = await this.seedProducts(categoryIds);
    const customerIds = await this.seedCustomers();
    await this.seedOrders(customerIds, products);

    this.logger.log('Seeding complete.');
  }

  private async truncate(): Promise<void> {
    await this.customers.query(
      'TRUNCATE TABLE order_items, orders, products, categories, customers RESTART IDENTITY CASCADE',
    );
    this.logger.log('Truncated seed tables.');
  }

  private async seedCategories(): Promise<string[]> {
    const rows: Partial<Category>[] = Array.from(
      { length: SEED_CONFIG.categories },
      (_, i) => ({ id: randomUUID(), ...makeCategory(i) }),
    );
    await this.insertChunked(this.categories, rows);
    this.logger.log(`Inserted ${rows.length} categories.`);
    return rows.map((r) => r.id!);
  }

  private async seedProducts(categoryIds: string[]): Promise<SeedProduct[]> {
    const rows: Partial<Product>[] = Array.from(
      { length: SEED_CONFIG.products },
      (_, i) => ({
        id: randomUUID(),
        ...makeProduct(faker.helpers.arrayElement(categoryIds), i),
      }),
    );
    await this.insertChunked(this.products, rows);
    this.logger.log(`Inserted ${rows.length} products.`);
    return rows.map((r) => ({ id: r.id!, price: r.price! }));
  }

  private async seedCustomers(): Promise<string[]> {
    const rows: Partial<Customer>[] = Array.from(
      { length: SEED_CONFIG.customers },
      (_, i) => ({ id: randomUUID(), ...makeCustomer(i) }),
    );
    await this.insertChunked(this.customers, rows);
    this.logger.log(`Inserted ${rows.length} customers.`);
    return rows.map((r) => r.id!);
  }

  private async seedOrders(
    customerIds: string[],
    products: SeedProduct[],
  ): Promise<void> {
    const ordering = customerIds.slice(
      0,
      Math.max(
        1,
        Math.floor(customerIds.length * (1 - SEED_CONFIG.orderlessRatio)),
      ),
    );

    const to = new Date();
    const from = new Date(to);
    from.setMonth(from.getMonth() - SEED_CONFIG.monthsBack);

    const weighted = STATUS_WEIGHTS.map((s) => ({
      weight: s.weight,
      value: s.status,
    }));

    const orderRows: Partial<Order>[] = [];
    const itemRows: Partial<OrderItem>[] = [];

    for (let i = 0; i < SEED_CONFIG.orders; i++) {
      const customerId = faker.helpers.arrayElement(ordering);
      const status = faker.helpers.weightedArrayElement(weighted);
      const createdAt = faker.date.between({ from, to });
      const { order, items } = makeOrder(
        customerId,
        products,
        createdAt,
        status,
      );

      const orderId = randomUUID();
      orderRows.push({ id: orderId, ...order });
      for (const item of items) {
        itemRows.push({ id: randomUUID(), orderId, ...item });
      }
    }

    await this.insertChunked(this.orders, orderRows);
    await this.insertChunked(this.orderItems, itemRows);
    this.logger.log(
      `Inserted ${orderRows.length} orders (${ordering.length} ordering customers, ` +
        `${customerIds.length - ordering.length} order-less) and ${itemRows.length} items.`,
    );
  }

  private async insertChunked<T extends object>(
    repo: Repository<T>,
    rows: Partial<T>[],
  ): Promise<void> {
    for (let i = 0; i < rows.length; i += SEED_CONFIG.chunkSize) {
      const chunk = rows.slice(i, i + SEED_CONFIG.chunkSize);
      await repo.insert(chunk as T[]);
    }
  }
}
