import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import {
  BRAZILIAN_STATE_CODES,
  type BrazilianState,
} from '../constants/brazilian-states';

export class UpdateCustomerDto {
  @ApiPropertyOptional({
    description: 'Customer full name.',
    example: 'Maria Silva',
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({
    description: 'Unique customer email.',
    example: 'maria@example.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'City of residence.',
    example: 'Curitiba',
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  city?: string;

  @ApiPropertyOptional({
    description:
      'Brazilian state UF code. Case-insensitive on input (trimmed + upper-cased).',
    example: 'PR',
    enum: BRAZILIAN_STATE_CODES,
  })
  @IsOptional()
  @Transform(({ value }) => {
    const v: unknown = value;
    return typeof v === 'string' ? v.trim().toUpperCase() : v;
  })
  @IsIn(BRAZILIAN_STATE_CODES, {
    message: 'state must be a valid Brazilian UF code (e.g. PR, SP, RJ)',
  })
  state?: BrazilianState;
}
