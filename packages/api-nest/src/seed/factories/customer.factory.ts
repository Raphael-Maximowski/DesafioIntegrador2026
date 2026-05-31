import { fakerPT_BR as faker } from '@faker-js/faker';
import { Customer } from '../../domains/customers/entities/customer.entity';
import {
  BRAZILIAN_STATES,
  DEFAULT_COUNTRY,
} from '../../domains/customers/constants/brazilian-states';

export function makeCustomer(index: number): Partial<Customer> {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const state = faker.helpers.arrayElement(BRAZILIAN_STATES);
  return {
    name: `${firstName} ${lastName}`,
    email: faker.internet
      .email({ firstName, lastName, provider: `seed${index}.example.com` })
      .toLowerCase(),
    city: faker.location.city(),
    state: state.symbol,
    country: DEFAULT_COUNTRY,
  };
}
