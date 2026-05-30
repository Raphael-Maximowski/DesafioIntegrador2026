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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { PaginatedCustomersDto } from './dto/paginated-customers.dto';
import { StateDto } from './dto/state.dto';

@ApiTags('customers')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid access token.',
  type: ErrorResponseDto,
})
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a customer' })
  @ApiCreatedResponse({
    description: 'Customer created.',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already taken.',
    type: ErrorResponseDto,
  })
  async create(@Body() dto: CreateCustomerDto) {
    const customer = await this.customers.create(dto);
    return CustomerResponseDto.fromEntity(customer);
  }

  @Get()
  @ApiOperation({
    summary: 'List customers',
    description: 'Returns a paginated, optionally-filtered list of customers.',
  })
  @ApiOkResponse({
    description: 'Paginated customers.',
    type: PaginatedCustomersDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters.',
    type: ErrorResponseDto,
  })
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
  @ApiOperation({
    summary: 'List Brazilian states',
    description:
      'Reference data: all Brazilian state UF codes and names, for populating the state field.',
  })
  @ApiOkResponse({ description: 'All Brazilian states.', type: [StateDto] })
  listStates() {
    return this.customers.listStates();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by id' })
  @ApiParam({ name: 'id', description: 'Customer UUID.', format: 'uuid' })
  @ApiOkResponse({ description: 'The customer.', type: CustomerResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Malformed UUID.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found.',
    type: ErrorResponseDto,
  })
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const customer = await this.customers.getById(id);
    return CustomerResponseDto.fromEntity(customer);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a customer',
    description: 'Partial update — only the provided fields change.',
  })
  @ApiParam({ name: 'id', description: 'Customer UUID.', format: 'uuid' })
  @ApiOkResponse({
    description: 'The updated customer.',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or malformed UUID.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already taken.',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const customer = await this.customers.update(id, dto);
    return CustomerResponseDto.fromEntity(customer);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiParam({ name: 'id', description: 'Customer UUID.', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Customer deleted.' })
  @ApiResponse({
    status: 400,
    description: 'Malformed UUID.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found.',
    type: ErrorResponseDto,
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customers.remove(id);
  }
}
