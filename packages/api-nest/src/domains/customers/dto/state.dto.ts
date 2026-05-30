import { ApiProperty } from '@nestjs/swagger';

export class StateDto {
  @ApiProperty({ description: 'State UF code.', example: 'PR' })
  symbol: string;

  @ApiProperty({ description: 'Full state name.', example: 'Paraná' })
  name: string;
}
