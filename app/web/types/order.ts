import type { Customer } from "./customer";
import type { Product } from "./product";

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";

export const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "CANCELLED"];

export interface OrderItem {
  id: string;
  product: Product | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  customer: Customer;
  items: OrderItem[];
  status: OrderStatus;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedOrders {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
}

export interface CreateOrderDto {
  customerId: string;
  items: CreateOrderItemDto[];
}

export interface UpdateOrderDto {
  status: OrderStatus;
}

export interface UpdateOrderItemDto {
  quantity: number;
}

export interface OrderQuery {
  page?: number;
  limit?: number;
  customerId?: string;
  status?: OrderStatus;
  totalMin?: number;
  totalMax?: number;
  createdAtFrom?: string;
  createdAtTo?: string;
}
