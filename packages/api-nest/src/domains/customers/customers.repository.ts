import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

export interface CustomerFilters {
  name?: string;
  email?: string;
  city?: string;
  state?: string;
}

@Injectable()
export class CustomersRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  findById(id: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Customer>): Promise<Customer> {
    return this.repo.save(this.repo.create(data));
  }

  async update(
    id: string,
    data: Partial<Customer>,
  ): Promise<Customer | undefined> {
    const customer = await this.repo.preload({ id, ...data });
    if (!customer) return undefined;
    return this.repo.save(customer);
  }

  async delete(id: string): Promise<number> {
    const result = await this.repo.delete(id);
    return result.affected ?? 0;
  }

  findAndCount(
    filters: CustomerFilters,
    page: number,
    limit: number,
  ): Promise<[Customer[], number]> {
    const where: FindOptionsWhere<Customer> = {};
    for (const key of ['name', 'email', 'city', 'state'] as const) {
      const value = filters[key];
      if (value !== undefined) {
        (where as Record<string, unknown>)[key] = ILike(`%${value}%`);
      }
    }

    return this.repo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
