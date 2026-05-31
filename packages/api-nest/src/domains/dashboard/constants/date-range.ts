export const DATE_RANGES = ['30d', '6m', 'year', 'custom'] as const;

export type DateRange = (typeof DATE_RANGES)[number];

export const DEFAULT_DATE_RANGE: DateRange = '30d';

export const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const TOP_N = 5;

export const OTHER_LABEL = 'Other';
