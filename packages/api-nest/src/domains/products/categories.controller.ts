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
  ApiConflictResponse,
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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { PaginatedCategoriesDto } from './dto/paginated-category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid access token.',
  type: ErrorResponseDto,
})
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  @ApiCreatedResponse({
    description: 'Category created.',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
    type: ErrorResponseDto,
  })
  async create(@Body() dto: CreateCategoryDto) {
    const category = await this.categories.create(dto);
    return CategoryResponseDto.fromEntity(category);
  }

  @Get()
  @ApiOperation({
    summary: 'List categories',
    description: 'Returns a paginated, optionally-filtered list of categories.',
  })
  @ApiOkResponse({
    description: 'Paginated categories.',
    type: PaginatedCategoriesDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters.',
    type: ErrorResponseDto,
  })
  async list(@Query() query: QueryCategoryDto) {
    const { data, total, page, limit } = await this.categories.list(query);
    return {
      data: CategoryResponseDto.fromEntities(data),
      total,
      page,
      limit,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by id' })
  @ApiParam({ name: 'id', description: 'Category UUID.', format: 'uuid' })
  @ApiOkResponse({ description: 'The category.', type: CategoryResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Malformed UUID.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found.',
    type: ErrorResponseDto,
  })
  async get(@Param('id', ParseUUIDPipe) id: string) {
    const category = await this.categories.getById(id);
    return CategoryResponseDto.fromEntity(category);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a category',
    description: 'Partial update — only the provided fields change.',
  })
  @ApiParam({ name: 'id', description: 'Category UUID.', format: 'uuid' })
  @ApiOkResponse({
    description: 'The updated category.',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or malformed UUID.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found.',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.categories.update(id, dto);
    return CategoryResponseDto.fromEntity(category);
  }

  @Patch(':id/detach-products')
  @ApiOperation({
    summary: 'Detach all products from a category',
    description:
      'Sets categoryId = null on every product in this category, so the category can be deleted.',
  })
  @ApiParam({ name: 'id', description: 'Category UUID.', format: 'uuid' })
  @ApiOkResponse({
    description: 'Number of products detached.',
    schema: {
      type: 'object',
      properties: { detached: { type: 'number', example: 3 } },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Malformed UUID.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found.',
    type: ErrorResponseDto,
  })
  detachProducts(@Param('id', ParseUUIDPipe) id: string) {
    return this.categories.detachProducts(id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a category',
    description:
      'Fails with 409 if any product is still attached — detach them first.',
  })
  @ApiParam({ name: 'id', description: 'Category UUID.', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Category deleted.' })
  @ApiResponse({
    status: 400,
    description: 'Malformed UUID.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Category still has products attached.',
    type: ErrorResponseDto,
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categories.remove(id);
  }
}
