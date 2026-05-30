import { Customer } from '../entities/customer.entity';

export class CustomerResponseDto {
  id: string;
  name: string;
  email: string;
  city: string;
  state: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      city: customer.city,
      state: customer.state,
      country: customer.country,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  static fromEntities(customers: Customer[]): CustomerResponseDto[] {
    return customers.map((customer) =>
      CustomerResponseDto.fromEntity(customer),
    );
  }
}
