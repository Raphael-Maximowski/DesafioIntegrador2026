import { fakerPT_BR as faker } from '@faker-js/faker';
import { Category } from '../../domains/products/entities/category.entity';

export function makeCategory(index: number): Partial<Category> {
  return {
    name: `${faker.commerce.department()} ${index + 1}`,
    description: faker.lorem.sentence(),
  };
}
