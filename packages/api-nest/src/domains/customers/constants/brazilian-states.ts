export const BRAZILIAN_STATES = [
  { symbol: 'AC', name: 'Acre' },
  { symbol: 'AL', name: 'Alagoas' },
  { symbol: 'AP', name: 'Amapá' },
  { symbol: 'AM', name: 'Amazonas' },
  { symbol: 'BA', name: 'Bahia' },
  { symbol: 'CE', name: 'Ceará' },
  { symbol: 'DF', name: 'Distrito Federal' },
  { symbol: 'ES', name: 'Espírito Santo' },
  { symbol: 'GO', name: 'Goiás' },
  { symbol: 'MA', name: 'Maranhão' },
  { symbol: 'MT', name: 'Mato Grosso' },
  { symbol: 'MS', name: 'Mato Grosso do Sul' },
  { symbol: 'MG', name: 'Minas Gerais' },
  { symbol: 'PA', name: 'Pará' },
  { symbol: 'PB', name: 'Paraíba' },
  { symbol: 'PR', name: 'Paraná' },
  { symbol: 'PE', name: 'Pernambuco' },
  { symbol: 'PI', name: 'Piauí' },
  { symbol: 'RJ', name: 'Rio de Janeiro' },
  { symbol: 'RN', name: 'Rio Grande do Norte' },
  { symbol: 'RS', name: 'Rio Grande do Sul' },
  { symbol: 'RO', name: 'Rondônia' },
  { symbol: 'RR', name: 'Roraima' },
  { symbol: 'SC', name: 'Santa Catarina' },
  { symbol: 'SP', name: 'São Paulo' },
  { symbol: 'SE', name: 'Sergipe' },
  { symbol: 'TO', name: 'Tocantins' },
] as const;

export type BrazilianState = (typeof BRAZILIAN_STATES)[number]['symbol'];

export const DEFAULT_COUNTRY = 'Brazil';

export const BRAZILIAN_STATE_CODES: readonly BrazilianState[] =
  BRAZILIAN_STATES.map((state) => state.symbol);
