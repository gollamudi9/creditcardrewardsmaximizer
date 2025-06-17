import { APIClient } from '../api/base';
import {
  ForecastData,
  ForecastPeriod,
  AdhocExpense,
  SpendingTrend,
  BudgetVariance,
  FinancialHealthIndicator,
  CashFlowProjection,
  AnalyticsAlert,
  CustomDateRange,
  ExportOptions,
} from '@/types/analytics';

export interface ForecastRequest {
  period: ForecastPeriod['period'];
  includeAdhocExpenses: boolean;
  manualAdjustments?: {
    incomeMultiplier?: number;
    expenseMultiplier?: number;
    seasonalAdjustment?: number;
  };
}

export interface AnalyticsFilters {
  dateRange: CustomDateRange;
  categories?: string[];
  cards?: string[];
  includeRecurring?: boolean;
}

export class AnalyticsService {
  private apiClient: APIClient;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
  }

  // Forecasting Methods
  async generateForecast(request: ForecastRequest): Promise<{
    forecast: ForecastData[];
    accuracy: number;
    lastUpdated: string;
  }> {
    return this.apiClient.post('/api/analytics/forecast', request);
  }

  async updateForecastVariables(adjustments: {
    incomeMultiplier?: number;
    expenseMultiplier?: number;
    seasonalAdjustment?: number;
  }): Promise<{ success: boolean }> {
    return this.apiClient.put('/api/analytics/forecast/variables', adjustments);
  }

  // Adhoc Expense Planning
  async addAdhocExpense(expense: Omit<AdhocExpense, 'id'>): Promise<{ id: string }> {
    return this.apiClient.post('/api/analytics/adhoc-expenses', expense);
  }

  async updateAdhocExpense(id: string, expense: Partial<AdhocExpense>): Promise<{ success: boolean }> {
    return this.apiClient.put(`/api/analytics/adhoc-expenses/${id}`, expense);
  }

  async deleteAdhocExpense(id: string): Promise<{ success: boolean }> {
    return this.apiClient.delete(`/api/analytics/adhoc-expenses/${id}`);
  }

  async getAdhocExpenses(): Promise<{ expenses: AdhocExpense[] }> {
    return this.apiClient.get('/api/analytics/adhoc-expenses');
  }

  async calculateAdhocImpact(expenseId: string): Promise<{
    monthlyImpact: number[];
    totalImpact: number;
    affectedMonths: string[];
  }> {
    return this.apiClient.get(`/api/analytics/adhoc-expenses/${expenseId}/impact`);
  }

  // Analytics Dashboards
  async getSpendingTrends(filters: AnalyticsFilters): Promise<{
    trends: SpendingTrend[];
    totalSpending: number;
    averageMonthly: number;
  }> {
    return this.apiClient.post('/api/analytics/spending-trends', filters);
  }

  async getBudgetVariance(filters: AnalyticsFilters): Promise<{
    variances: BudgetVariance[];
    overallVariance: number;
    categoriesOverBudget: number;
  }> {
    return this.apiClient.post('/api/analytics/budget-variance', filters);
  }

  async getFinancialHealth(): Promise<{
    indicators: FinancialHealthIndicator[];
    overallScore: number;
    recommendations: string[];
  }> {
    return this.apiClient.get('/api/analytics/financial-health');
  }

  async getCashFlowProjection(months: number): Promise<{
    projections: CashFlowProjection[];
    minimumBalance: number;
    maximumBalance: number;
    averageMonthlyFlow: number;
  }> {
    return this.apiClient.get(`/api/analytics/cash-flow?months=${months}`);
  }

  async getCategoryAnalysis(filters: AnalyticsFilters): Promise<{
    categories: Array<{
      name: string;
      amount: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
      transactions: number;
    }>;
    topCategories: string[];
    growingCategories: string[];
  }> {
    return this.apiClient.post('/api/analytics/category-analysis', filters);
  }

  // Alerts and Notifications
  async getAnalyticsAlerts(): Promise<{
    alerts: AnalyticsAlert[];
    unreadCount: number;
  }> {
    return this.apiClient.get('/api/analytics/alerts');
  }

  async markAlertAsRead(alertId: string): Promise<{ success: boolean }> {
    return this.apiClient.put(`/api/analytics/alerts/${alertId}/read`);
  }

  async dismissAlert(alertId: string): Promise<{ success: boolean }> {
    return this.apiClient.delete(`/api/analytics/alerts/${alertId}`);
  }

  async configureAlertSettings(settings: {
    spendingThreshold: number;
    budgetOverrunWarning: number;
    largeExpenseAmount: number;
    forecastDeviationPercent: number;
    enableEmailAlerts: boolean;
    enablePushAlerts: boolean;
  }): Promise<{ success: boolean }> {
    return this.apiClient.put('/api/analytics/alert-settings', settings);
  }

  // Export and Reporting
  async exportReport(options: ExportOptions): Promise<{
    downloadUrl: string;
    expiresAt: string;
  }> {
    return this.apiClient.post('/api/analytics/export', options);
  }

  async getReportHistory(): Promise<{
    reports: Array<{
      id: string;
      name: string;
      format: string;
      createdAt: string;
      downloadUrl: string;
      expiresAt: string;
    }>;
  }> {
    return this.apiClient.get('/api/analytics/reports');
  }

  // Comparative Analysis
  async getComparativeAnalysis(dateRanges: CustomDateRange[]): Promise<{
    comparison: Array<{
      period: string;
      income: number;
      expenses: number;
      netIncome: number;
      topCategories: string[];
      growthRate: number;
    }>;
    insights: string[];
  }> {
    return this.apiClient.post('/api/analytics/comparative', { dateRanges });
  }

  // Advanced Analytics
  async getSeasonalPatterns(): Promise<{
    patterns: Array<{
      month: string;
      seasonalFactor: number;
      typicalSpending: number;
      confidence: number;
    }>;
    recommendations: string[];
  }> {
    return this.apiClient.get('/api/analytics/seasonal-patterns');
  }

  async getPredictiveInsights(): Promise<{
    insights: Array<{
      type: 'opportunity' | 'warning' | 'trend';
      title: string;
      description: string;
      confidence: number;
      impact: 'high' | 'medium' | 'low';
      actionable: boolean;
    }>;
  }> {
    return this.apiClient.get('/api/analytics/predictive-insights');
  }
}