import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, ValidateIf } from 'class-validator';
import {
  DATE_RANGES,
  DEFAULT_DATE_RANGE,
  type DateRange,
} from '../constants/date-range';

export class QueryDashboardDto {
  @ApiPropertyOptional({
    description:
      'Time window for the KPIs and breakdowns. The monthly-sales chart always covers the current calendar year regardless of this value.',
    enum: DATE_RANGES,
    default: DEFAULT_DATE_RANGE,
  })
  @IsOptional()
  @IsIn(DATE_RANGES)
  range: DateRange = DEFAULT_DATE_RANGE;

  @ApiPropertyOptional({
    description:
      'Start of the custom window (inclusive). Required when range=custom; ignored otherwise.',
    format: 'date-time',
  })
  @ValidateIf((o: QueryDashboardDto) => o.range === 'custom')
  @Type(() => Date)
  @IsDate()
  startedAt?: Date;

  @ApiPropertyOptional({
    description:
      'End of the custom window (inclusive). Required when range=custom; ignored otherwise.',
    format: 'date-time',
  })
  @ValidateIf((o: QueryDashboardDto) => o.range === 'custom')
  @Type(() => Date)
  @IsDate()
  finishedAt?: Date;
}
