import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    const customer = await this.customers.create(dto);
    return CustomerResponseDto.fromEntity(customer);
  }

  @Get()
  async list(@Query() query: QueryCustomersDto) {
    const { data, total, page, limit } = await this.customers.list(query);
    return {
      data: CustomerResponseDto.fromEntities(data),
      total,
      page,
      limit,
    };
  }

  @Get('states')
  listStates() {
    return this.customers.listStates();
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const customer = await this.customers.getById(id);
    return CustomerResponseDto.fromEntity(customer);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const customer = await this.customers.update(id, dto);
    return CustomerResponseDto.fromEntity(customer);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customers.remove(id);
  }
}
