import { api } from "@/lib/api";
import type {
  Customer,
  PaginatedCustomers,
  CustomerState,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQuery,
} from "@/types/customer";

export async function listCustomers(
  query: CustomerQuery = {}
): Promise<PaginatedCustomers> {
  const params = new URLSearchParams();
  if (query.page)  params.set("page",  String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.name)  params.set("name",  query.name);
  if (query.email) params.set("email", query.email);
  if (query.city)  params.set("city",  query.city);
  if (query.state) params.set("state", query.state);

  const { data } = await api.get<PaginatedCustomers>(
    `/customers?${params.toString()}`
  );
  return data;
}

export async function getCustomer(id: string): Promise<Customer> {
  const { data } = await api.get<Customer>(`/customers/${id}`);
  return data;
}

export async function createCustomer(dto: CreateCustomerDto): Promise<Customer> {
  const { data } = await api.post<Customer>("/customers", dto);
  return data;
}

export async function updateCustomer(
  id: string,
  dto: UpdateCustomerDto
): Promise<Customer> {
  const { data } = await api.patch<Customer>(`/customers/${id}`, dto);
  return data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await api.delete(`/customers/${id}`);
}

export async function listStates(): Promise<CustomerState[]> {
  const { data } = await api.get<CustomerState[]>("/customers/states");
  return data;
}
