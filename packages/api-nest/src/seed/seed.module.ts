import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../domains/customers/entities/customer.entity';
import { Category } from '../domains/products/entities/category.entity';
import { Product } from '../domains/products/entities/product.entity';
import { Order } from '../domains/orders/entities/order.entity';
import { OrderItem } from '../domains/orders/entities/order-item.entity';
import { SeederService } from './seeder.service';

const ENTITIES = [Customer, Category, Product, Order, OrderItem];

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: ENTITIES,
      synchronize: false,
    }),
    TypeOrmModule.forFeature(ENTITIES),
  ],
  providers: [SeederService],
})
export class SeedModule {}
