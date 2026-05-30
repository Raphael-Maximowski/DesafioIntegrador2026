import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { CategoriesController } from './categories.controller';
import { ProductsController } from './products.controller';
import { CategoriesService } from './categories.service';
import { ProductsService } from './products.service';
import { CategoriesRepository } from './categories.repository';
import { ProductsRepository } from './products.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category])],
  controllers: [CategoriesController, ProductsController],
  providers: [
    CategoriesService,
    ProductsService,
    CategoriesRepository,
    ProductsRepository,
  ],
  exports: [CategoriesService, ProductsService],
})
export class ProductsModule {}
