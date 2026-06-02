import { api } from "@/lib/api";
import type {
  Product,
  Category,
  PaginatedProducts,
  PaginatedCategories,
  CreateProductDto,
  UpdateProductDto,
  ProductQuery,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQuery,
} from "@/types/product";

export async function listProducts(query: ProductQuery = {}): Promise<PaginatedProducts> {
  const params = new URLSearchParams();
  if (query.page)        params.set("page",        String(query.page));
  if (query.limit)       params.set("limit",       String(query.limit));
  if (query.name)        params.set("name",        query.name);
  if (query.priceMin !== undefined) params.set("priceMin", String(query.priceMin));
  if (query.priceMax !== undefined) params.set("priceMax", String(query.priceMax));
  if (query.stockMin !== undefined) params.set("stockMin", String(query.stockMin));
  if (query.stockMax !== undefined) params.set("stockMax", String(query.stockMax));
  if (query.categoryId)  params.set("categoryId",  query.categoryId);
  if (query.uncategorized) params.set("uncategorized", "true");

  const { data } = await api.get<PaginatedProducts>(`/products?${params.toString()}`);
  return data;
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await api.get<Product>(`/products/${id}`);
  return data;
}

export async function createProduct(dto: CreateProductDto): Promise<Product> {
  const { data } = await api.post<Product>("/products", dto);
  return data;
}

export async function updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
  const { data } = await api.patch<Product>(`/products/${id}`, dto);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function listCategories(query: CategoryQuery = {}): Promise<PaginatedCategories> {
  const params = new URLSearchParams();
  if (query.page)  params.set("page",  String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.name)  params.set("name",  query.name);

  const { data } = await api.get<PaginatedCategories>(`/categories?${params.toString()}`);
  return data;
}

export async function getCategory(id: string): Promise<Category> {
  const { data } = await api.get<Category>(`/categories/${id}`);
  return data;
}

export async function createCategory(dto: CreateCategoryDto): Promise<Category> {
  const { data } = await api.post<Category>("/categories", dto);
  return data;
}

export async function updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
  const { data } = await api.patch<Category>(`/categories/${id}`, dto);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}
