export interface Customer {
  id: string;
  name: string;
  email: string;
  city: string;
  state: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCustomers {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
}

export interface CustomerState {
  symbol: string;
  name: string;
}

export interface CreateCustomerDto {
  name: string;
  email: string;
  city: string;
  state: string;
}

export interface UpdateCustomerDto {
  name?: string;
  email?: string;
  city?: string;
  state?: string;
}

export interface CustomerQuery {
  page?: number;
  limit?: number;
  name?: string;
  email?: string;
  city?: string;
  state?: string;
}
