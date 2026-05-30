export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'SHIPPED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DEFAULT_ORDER_STATUS: OrderStatus = 'PENDING';
