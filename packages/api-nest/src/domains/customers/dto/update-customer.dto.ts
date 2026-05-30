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
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  city?: string;

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
