import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { ProductsRepository } from './products.repository';
import { CategoriesRepository } from './categories.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Product } from './entities/product.entity';

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly products: ProductsRepository,
    private readonly categories: CategoriesRepository,
  ) {}

  async getById(id: string): Promise<Product> {
    const product = await this.products.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async list(query: QueryProductDto): Promise<PaginatedProducts> {
    const { page, limit, ...filters } = query;
    const [data, total] = await this.products.findAndCount(
      filters,
      page,
      limit,
    );
    return { data, total, page, limit };
  }

  async create(dto: CreateProductDto): Promise<Product> {
    await this.assertCategoryExists(dto.categoryId);
    const created = await this.persist(() => this.products.create(dto));
    return this.getById(created.id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    if (dto.categoryId) await this.assertCategoryExists(dto.categoryId);
    const product = await this.persist(() => this.products.update(id, dto));
    if (!product) throw new NotFoundException('Product not found');
    return this.getById(product.id);
  }

  async remove(id: string): Promise<void> {
    const affected = await this.products.delete(id);
    if (affected === 0) throw new NotFoundException('Product not found');
  }

  private async assertCategoryExists(
    categoryId?: string | null,
  ): Promise<void> {
    if (!categoryId) return;
    const category = await this.categories.findById(categoryId);
    if (!category) throw new BadRequestException('category not found');
  }

  private async persist<T>(op: () => Promise<T>): Promise<T> {
    try {
      return await op();
    } catch (err) {
      if (err instanceof QueryFailedError) {
        const code = (err as { code?: string }).code;
        if (code === '23503')
          throw new BadRequestException('category not found');
      }
      throw err;
    }
  }
}
