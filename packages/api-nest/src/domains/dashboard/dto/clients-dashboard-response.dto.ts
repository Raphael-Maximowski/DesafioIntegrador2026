import { ApiProperty } from '@nestjs/swagger';

export class ClientsDashboardResponseDto {
  @ApiProperty({
    description: 'Total number of registered clients (all customers).',
    example: 1280,
  })
  totalClients: number;

  @ApiProperty({
    description:
      'Median lifetime value across all clients. LTV sums a client’s PAID and SHIPPED order totals; clients with no qualifying order count as 0.',
    example: 349.9,
  })
  medianLtv: number;
}
