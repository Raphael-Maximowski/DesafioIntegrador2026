import { fakerPT_BR as faker } from '@faker-js/faker';
import { Product } from '../../domains/products/entities/product.entity';
import { SEED_CONFIG } from '../seed.config';

export function makeProduct(
  categoryId: string,
  index: number,
): Partial<Product> {
  const { productPrice, productStock } = SEED_CONFIG;
  return {
    name: `${faker.commerce.productName()} ${index + 1}`,
    price: faker.number.float({
      min: productPrice.min,
      max: productPrice.max,
      fractionDigits: 2,
    }),
    stock: faker.number.int({ min: productStock.min, max: productStock.max }),
    categoryId,
  };
}
