import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  ILike,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Product } from './entities/product.entity';

export interface ProductFilters {
  name?: string;
  priceMin?: number;
  priceMax?: number;
  stockMin?: number;
  stockMax?: number;
  categoryId?: string;
  uncategorized?: boolean;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  updatedAtFrom?: Date;
  updatedAtTo?: Date;
}

function range<T extends number | Date>(min?: T, max?: T) {
  if (min !== undefined && max !== undefined) return Between(min, max);
  if (min !== undefined) return MoreThanOrEqual(min);
  if (max !== undefined) return LessThanOrEqual(max);
  return undefined;
}

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  findById(id: string): Promise<Product | null> {
    return this.repo.findOne({ where: { id }, relations: { category: true } });
  }

  create(data: Partial<Product>): Promise<Product> {
    return this.repo.save(this.repo.create(data));
  }

  async update(
    id: string,
    data: Partial<Product>,
  ): Promise<Product | undefined> {
    const product = await this.repo.preload({ id, ...data });
    if (!product) return undefined;
    return this.repo.save(product);
  }

  async delete(id: string): Promise<number> {
    const result = await this.repo.delete(id);
    return result.affected ?? 0;
  }

  countByCategory(categoryId: string): Promise<number> {
    return this.repo.count({ where: { categoryId } });
  }

  async detachByCategory(categoryId: string): Promise<number> {
    const result = await this.repo.update({ categoryId }, { categoryId: null });
    return result.affected ?? 0;
  }

  findAndCount(
    filters: ProductFilters,
    page: number,
    limit: number,
  ): Promise<[Product[], number]> {
    const where: FindOptionsWhere<Product> = {};
    if (filters.name !== undefined) where.name = ILike(`%${filters.name}%`);

    const price = range(filters.priceMin, filters.priceMax);
    if (price) where.price = price;
    const stock = range(filters.stockMin, filters.stockMax);
    if (stock) where.stock = stock;

    if (filters.uncategorized) where.categoryId = IsNull();
    else if (filters.categoryId !== undefined)
      where.categoryId = filters.categoryId;

    const createdAt = range(filters.createdAtFrom, filters.createdAtTo);
    if (createdAt) where.createdAt = createdAt;
    const updatedAt = range(filters.updatedAtFrom, filters.updatedAtTo);
    if (updatedAt) where.updatedAt = updatedAt;

    return this.repo.findAndCount({
      where,
      relations: { category: true },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
