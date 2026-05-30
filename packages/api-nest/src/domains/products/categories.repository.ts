import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Category } from './entities/category.entity';

export interface CategoryFilters {
  name?: string;
  description?: string;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  updatedAtFrom?: Date;
  updatedAtTo?: Date;
}

function range(from?: Date, to?: Date) {
  if (from !== undefined && to !== undefined) return Between(from, to);
  if (from !== undefined) return MoreThanOrEqual(from);
  if (to !== undefined) return LessThanOrEqual(to);
  return undefined;
}

@Injectable()
export class CategoriesRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  findById(id: string): Promise<Category | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Category>): Promise<Category> {
    return this.repo.save(this.repo.create(data));
  }

  async update(
    id: string,
    data: Partial<Category>,
  ): Promise<Category | undefined> {
    const category = await this.repo.preload({ id, ...data });
    if (!category) return undefined;
    return this.repo.save(category);
  }

  async delete(id: string): Promise<number> {
    const result = await this.repo.delete(id);
    return result.affected ?? 0;
  }

  findAndCount(
    filters: CategoryFilters,
    page: number,
    limit: number,
  ): Promise<[Category[], number]> {
    const where: FindOptionsWhere<Category> = {};
    if (filters.name !== undefined) where.name = ILike(`%${filters.name}%`);
    if (filters.description !== undefined)
      where.description = ILike(`%${filters.description}%`);

    const createdAt = range(filters.createdAtFrom, filters.createdAtTo);
    if (createdAt) where.createdAt = createdAt;
    const updatedAt = range(filters.updatedAtFrom, filters.updatedAtTo);
    if (updatedAt) where.updatedAt = updatedAt;

    return this.repo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
