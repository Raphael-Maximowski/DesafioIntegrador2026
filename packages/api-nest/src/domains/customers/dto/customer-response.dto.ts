import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../entities/customer.entity';

export class CustomerResponseDto {
  @ApiProperty({
    description: 'Customer UUID.',
    format: 'uuid',
    example: '3f6c1a9e-9c2b-4f1a-bd4e-2a1c9d8e7f00',
  })
  id: string;

  @ApiProperty({ description: 'Customer full name.', example: 'Maria Silva' })
  name: string;

  @ApiProperty({
    description: 'Customer email.',
    format: 'email',
    example: 'maria@example.com',
  })
  email: string;

  @ApiProperty({ description: 'City of residence.', example: 'Curitiba' })
  city: string;

  @ApiProperty({ description: 'Brazilian state UF code.', example: 'PR' })
  state: string;

  @ApiProperty({ description: 'Country.', example: 'Brazil' })
  country: string;

  @ApiProperty({
    description: 'When the customer was created.',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the customer was last updated.',
    format: 'date-time',
  })
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
