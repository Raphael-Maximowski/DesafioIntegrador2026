import { fakerPT_BR as faker } from '@faker-js/faker';
import { Order } from '../../domains/orders/entities/order.entity';
import { OrderItem } from '../../domains/orders/entities/order-item.entity';
import { OrderStatus } from '../../domains/orders/constants/order-status';
import { SEED_CONFIG } from '../seed.config';

export interface SeedProduct {
  id: string;
  price: number;
}

export interface MadeOrder {
  order: Partial<Order>;
  items: Partial<OrderItem>[];
}

export function makeOrder(
  customerId: string,
  products: SeedProduct[],
  createdAt: Date,
  status: OrderStatus,
): MadeOrder {
  const { itemsPerOrder, quantityPerItem } = SEED_CONFIG;
  const count = faker.number.int({
    min: itemsPerOrder.min,
    max: Math.min(itemsPerOrder.max, products.length),
  });
  const picked = faker.helpers.arrayElements(products, count);

  const items: Partial<OrderItem>[] = picked.map((product) => ({
    productId: product.id,
    quantity: faker.number.int({
      min: quantityPerItem.min,
      max: quantityPerItem.max,
    }),
    unitPrice: product.price,
  }));

  const totalPrice = items.reduce(
    (sum, item) => sum + item.unitPrice! * item.quantity!,
    0,
  );

  return {
    order: {
      customerId,
      status,
      totalPrice: Math.round(totalPrice * 100) / 100,
      createdAt,
    },
    items,
  };
}
