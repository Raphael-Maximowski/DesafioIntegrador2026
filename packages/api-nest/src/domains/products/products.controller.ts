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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { PaginatedProductsDto } from './dto/paginated-product.dto';

@ApiTags('products')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid access token.',
  type: ErrorResponseDto,
})
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  @ApiCreatedResponse({
    description: 'Product created.',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or category not found.',
    type: ErrorResponseDto,
  })
  async create(@Body() dto: CreateProductDto) {
    const product = await this.products.create(dto);
    return ProductResponseDto.fromEntity(product);
  }

  @Get()
  @ApiOperation({
    summary: 'List products',
    description: 'Returns a paginated, optionally-filtered list of products.',
  })
  @ApiOkResponse({
    description: 'Paginated products.',
    type: PaginatedProductsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters.',
    type: ErrorResponseDto,
  })
  async list(@Query() query: QueryProductDto) {
    const { data, total, page, limit } = await this.products.list(query);
    return {
      data: ProductResponseDto.fromEntities(data),
      total,
      page,
      limit,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiParam({ name: 'id', description: 'Product UUID.', format: 'uuid' })
  @ApiOkResponse({ description: 'The product.', type: ProductResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Malformed UUID.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found.',
    type: ErrorResponseDto,
  })
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.products.getById(id);
    return ProductResponseDto.fromEntity(product);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a product',
    description:
      'Partial update — only the provided fields change. Pass categoryId: null to detach.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID.', format: 'uuid' })
  @ApiOkResponse({
    description: 'The updated product.',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed, malformed UUID, or category not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found.',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.products.update(id, dto);
    return ProductResponseDto.fromEntity(product);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product UUID.', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Product deleted.' })
  @ApiResponse({
    status: 400,
    description: 'Malformed UUID.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found.',
    type: ErrorResponseDto,
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.remove(id);
  }
}
