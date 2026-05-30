import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import {
  BRAZILIAN_STATE_CODES,
  type BrazilianState,
} from '../constants/brazilian-states';

export class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  city: string;

  @Transform(({ value }) => {
    const v: unknown = value;
    return typeof v === 'string' ? v.trim().toUpperCase() : v;
  })
  @IsIn(BRAZILIAN_STATE_CODES, {
    message: 'state must be a valid Brazilian UF code (e.g. PR, SP, RJ)',
  })
  state: BrazilianState;
}
