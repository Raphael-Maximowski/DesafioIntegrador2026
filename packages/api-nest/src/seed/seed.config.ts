import { OrderStatus } from '../domains/orders/constants/order-status';

export const SEED_CONFIG = {
  fakerSeed: 20260530,

  categories: 12,
  products: 120,
  customers: 300,

  orderlessRatio: 0.25,

  monthsBack: 12,
  orders: 1500,
  itemsPerOrder: { min: 1, max: 5 },
  quantityPerItem: { min: 1, max: 6 },

  productStock: { min: 50, max: 5000 },
  productPrice: { min: 5, max: 4000 },

  chunkSize: 500,
} as const;

export const STATUS_WEIGHTS: ReadonlyArray<{
  status: OrderStatus;
  weight: number;
}> = [
  { status: 'PAID', weight: 5 },
  { status: 'SHIPPED', weight: 3 },
  { status: 'PENDING', weight: 1 },
  { status: 'CANCELLED', weight: 1 },
];
