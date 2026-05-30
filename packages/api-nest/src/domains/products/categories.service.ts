import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { ProductsRepository } from './products.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { Category } from './entities/category.entity';

export interface PaginatedCategories {
  data: Category[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categories: CategoriesRepository,
    private readonly products: ProductsRepository,
  ) {}

  async getById(id: string): Promise<Category> {
    const category = await this.categories.findById(id);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async list(query: QueryCategoryDto): Promise<PaginatedCategories> {
    const { page, limit, ...filters } = query;
    const [data, total] = await this.categories.findAndCount(
      filters,
      page,
      limit,
    );
    return { data, total, page, limit };
  }

  create(dto: CreateCategoryDto): Promise<Category> {
    return this.categories.create(dto);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categories.update(id, dto);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async remove(id: string): Promise<void> {
    const attached = await this.products.countByCategory(id);
    if (attached > 0) {
      throw new ConflictException(
        'Category has products attached. Detach them first via PATCH /categories/:id/detach-products.',
      );
    }
    const affected = await this.categories.delete(id);
    if (affected === 0) throw new NotFoundException('Category not found');
  }

  async detachProducts(id: string): Promise<{ detached: number }> {
    await this.getById(id);
    const detached = await this.products.detachByCategory(id);
    return { detached };
  }
}
