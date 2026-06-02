import { api } from "@/lib/api";
import type {
  Order,
  PaginatedOrders,
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderItemDto,
  OrderQuery,
} from "@/types/order";

export async function listOrders(query: OrderQuery = {}): Promise<PaginatedOrders> {
  const params = new URLSearchParams();
  if (query.page)           params.set("page",           String(query.page));
  if (query.limit)          params.set("limit",          String(query.limit));
  if (query.customerId)     params.set("customerId",     query.customerId);
  if (query.status)         params.set("status",         query.status);
  if (query.totalMin !== undefined) params.set("totalMin", String(query.totalMin));
  if (query.totalMax !== undefined) params.set("totalMax", String(query.totalMax));
  if (query.createdAtFrom)  params.set("createdAtFrom",  query.createdAtFrom);
  if (query.createdAtTo)    params.set("createdAtTo",    query.createdAtTo);

  const { data } = await api.get<PaginatedOrders>(`/orders?${params.toString()}`);
  return data;
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${id}`);
  return data;
}

export async function createOrder(dto: CreateOrderDto): Promise<Order> {
  const { data } = await api.post<Order>("/orders", dto);
  return data;
}

export async function updateOrderStatus(id: string, dto: UpdateOrderDto): Promise<Order> {
  const { data } = await api.patch<Order>(`/orders/${id}`, dto);
  return data;
}

export async function deleteOrder(id: string): Promise<void> {
  await api.delete(`/orders/${id}`);
}

export async function updateOrderItem(orderId: string, itemId: string, dto: UpdateOrderItemDto): Promise<Order> {
  const { data } = await api.patch<Order>(`/orders/${orderId}/items/${itemId}`, dto);
  return data;
}

export async function deleteOrderItem(orderId: string, itemId: string): Promise<void> {
  await api.delete(`/orders/${orderId}/items/${itemId}`);
}
