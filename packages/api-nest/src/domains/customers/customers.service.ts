import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { Customer } from './entities/customer.entity';
import {
  BRAZILIAN_STATES,
  DEFAULT_COUNTRY,
} from './constants/brazilian-states';

export interface PaginatedCustomers {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class CustomersService {
  constructor(private readonly customers: CustomersRepository) {}

  listStates(): readonly { symbol: string; name: string }[] {
    return BRAZILIAN_STATES;
  }

  async getById(id: string): Promise<Customer> {
    const customer = await this.customers.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async list(query: QueryCustomersDto): Promise<PaginatedCustomers> {
    const { page, limit, ...filters } = query;
    const [data, total] = await this.customers.findAndCount(
      filters,
      page,
      limit,
    );
    return { data, total, page, limit };
  }

  create(dto: CreateCustomerDto): Promise<Customer> {
    return this.persist(() =>
      this.customers.create({ ...dto, country: DEFAULT_COUNTRY }),
    );
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.persist(() => this.customers.update(id, dto));
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async remove(id: string): Promise<void> {
    const affected = await this.customers.delete(id);
    if (affected === 0) throw new NotFoundException('Customer not found');
  }

  private async persist<T>(op: () => Promise<T>): Promise<T> {
    try {
      return await op();
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('email already taken');
      }
      throw err;
    }
  }
}
