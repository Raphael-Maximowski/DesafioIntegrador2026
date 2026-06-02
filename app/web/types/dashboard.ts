export type DashboardDateRange = "30d" | "6m" | "year" | "custom";

export interface QueryDashboard {
  range?: DashboardDateRange;
  startedAt?: string;
  finishedAt?: string;
}

export interface DashboardKpis {
  totalSales: number;
  totalClients: number;
  averageTicket: number;
  orderCount: number;
}

export interface MonthlySalesPoint {
  label: string;
  month: number;
  total: number;
}

export interface CategorySlice {
  label: string;
  amount: number;
  percentage: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  category: string;
  amount: number;
}

export interface RegionSlice {
  state: string;
  amount: number;
  percentage: number;
}

export interface DashboardOverview {
  kpis: DashboardKpis;
  monthlySales: MonthlySalesPoint[];
  categories: CategorySlice[];
  topProducts: TopProduct[];
  topRegions: RegionSlice[];
}

export interface ProductsDashboard {
  totalStock: number;
  lowStockCount: number;
  lowStockThreshold: number;
  activeCategories: number;
  totalStockValue: number;
}

export interface ClientsDashboard {
  totalClients: number;
  medianLtv: number;
}
