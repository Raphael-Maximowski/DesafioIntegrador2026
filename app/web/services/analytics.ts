import { flaskApi } from "@/lib/flaskApi";
import type { CustomerAnalytics, PaginatedCustomerAnalytics } from "@/types/analytics";

export interface TrainResult {
  status: string;
  message: string;
}

export async function getCustomerAnalytics(customerId: string): Promise<CustomerAnalytics> {
  const { data } = await flaskApi.get<CustomerAnalytics>(
    `/analytics/customers/${customerId}/metrics`
  );
  return data;
}

export async function listCustomerAnalytics(
  page = 1,
  perPage = 20
): Promise<PaginatedCustomerAnalytics> {
  const { data } = await flaskApi.get<PaginatedCustomerAnalytics>(
    `/analytics/customers/metrics?page=${page}&per_page=${perPage}`
  );
  return data;
}

export async function trainModel(): Promise<TrainResult> {
  const { data } = await flaskApi.post<TrainResult>("/train/model");
  return data;
}
