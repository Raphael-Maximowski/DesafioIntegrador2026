export interface CustomerMetrics {
  total_orders: number;
  total_spent: number;
  avg_ticket: number;
  days_since_last_order: number;
  frequency: number;
}

export type RiskLevel = "Baixo" | "Médio" | "Alto";

export interface CustomerAnalytics {
  customer_id: string;
  metrics: CustomerMetrics;
  churn_probability: number;
  churn_score: number;
  risk_level: RiskLevel;
  purchase_probability: number;
  purchase_score: number;
}

export interface PaginatedCustomerAnalytics {
  items: CustomerAnalytics[];
  total: number;
  page: number;
  per_page: number;
}
