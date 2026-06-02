export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: Category | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedCategories {
  data: Category[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateProductDto {
  name: string;
  price: number;
  stock: number;
  categoryId?: string;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  stock?: number;
  categoryId?: string | null;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  name?: string;
  priceMin?: number;
  priceMax?: number;
  stockMin?: number;
  stockMax?: number;
  categoryId?: string;
  uncategorized?: boolean;
}

export interface CreateCategoryDto {
  name: string;
  description: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
}

export interface CategoryQuery {
  page?: number;
  limit?: number;
  name?: string;
}
