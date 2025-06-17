export interface ForecastPeriod {
  period: 3 | 6 | 12 | 24;
  label: string;
}

export interface ForecastData {
  month: string;
  projectedIncome: number;
  projectedExpenses: number;
  netIncome: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  seasonalFactor: number;
}

export interface AdhocExpense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  isRecurring: boolean;
  frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  endDate?: string;
  description?: string;
}

export interface SpendingTrend {
  month: string;
  amount: number;
  category: string;
  percentChange: number;
}

export interface BudgetVariance {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  percentVariance: number;
}

export interface FinancialHealthIndicator {
  name: string;
  value: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  trend: 'up' | 'down' | 'stable';
}

export interface CashFlowProjection {
  date: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  cumulativeBalance: number;
}

export interface AnalyticsAlert {
  id: string;
  type: 'spending_pattern' | 'budget_overrun' | 'large_expense' | 'forecast_deviation';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  actionRequired: boolean;
}

export interface CustomDateRange {
  startDate: string;
  endDate: string;
  label?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  dateRange: CustomDateRange;
  includeCharts: boolean;
  includeForecasts: boolean;
  includeAlerts: boolean;
}