import { api } from "@/lib/api";
import type {
  DashboardOverview,
  ProductsDashboard,
  ClientsDashboard,
  QueryDashboard,
} from "@/types/dashboard";

export async function getOverview(query: QueryDashboard = {}): Promise<DashboardOverview> {
  const params = new URLSearchParams();
  if (query.range)      params.set("range",      query.range);
  if (query.startedAt)  params.set("startedAt",  query.startedAt);
  if (query.finishedAt) params.set("finishedAt", query.finishedAt);

  const { data } = await api.get<DashboardOverview>(`/dashboard/overview?${params.toString()}`);
  return data;
}

export async function getProductsDashboard(lowStockThreshold = 30): Promise<ProductsDashboard> {
  const { data } = await api.get<ProductsDashboard>(`/dashboard/products?lowStockThreshold=${lowStockThreshold}`);
  return data;
}

export async function getClientsDashboard(): Promise<ClientsDashboard> {
  const { data } = await api.get<ClientsDashboard>("/dashboard/clients");
  return data;
}
