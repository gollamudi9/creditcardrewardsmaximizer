import { useState, useCallback, useEffect } from 'react';
import { AnalyticsService } from '@/lib/services/analyticsService';
import { apiClient } from '@/lib/api/base';
import { useAuthContext } from '@/context/AuthContext';
import { useNotifications } from './useNotifications';
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
} from '@/types/analytics';

export function useAnalytics() {
  const { user } = useAuthContext();
  const { showError, showSuccess } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forecast State
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [forecastAccuracy, setForecastAccuracy] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<ForecastPeriod['period']>(12);

  // Adhoc Expenses State
  const [adhocExpenses, setAdhocExpenses] = useState<AdhocExpense[]>([]);

  // Analytics State
  const [spendingTrends, setSpendingTrends] = useState<SpendingTrend[]>([]);
  const [budgetVariances, setBudgetVariances] = useState<BudgetVariance[]>([]);
  const [financialHealth, setFinancialHealth] = useState<FinancialHealthIndicator[]>([]);
  const [cashFlowProjections, setCashFlowProjections] = useState<CashFlowProjection[]>([]);
  const [alerts, setAlerts] = useState<AnalyticsAlert[]>([]);

  const analyticsService = new AnalyticsService(apiClient);

  // Initialize API client with auth token
  useEffect(() => {
    const initializeAuth = async () => {
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          apiClient.setAuthToken(session.access_token);
        }
      }
    };
    initializeAuth();
  }, [user]);

  // Forecasting Methods
  const generateForecast = useCallback(async (
    period: ForecastPeriod['period'],
    options?: {
      includeAdhocExpenses?: boolean;
      manualAdjustments?: {
        incomeMultiplier?: number;
        expenseMultiplier?: number;
        seasonalAdjustment?: number;
      };
    }
  ) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await analyticsService.generateForecast({
        period,
        includeAdhocExpenses: options?.includeAdhocExpenses ?? true,
        manualAdjustments: options?.manualAdjustments,
      });

      setForecast(response.forecast);
      setForecastAccuracy(response.accuracy);
      setSelectedPeriod(period);

      showSuccess('Forecast Updated', `Generated ${period}-month financial forecast`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate forecast';
      setError(errorMessage);
      showError('Forecast Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, showError, showSuccess]);

  const updateForecastVariables = useCallback(async (adjustments: {
    incomeMultiplier?: number;
    expenseMultiplier?: number;
    seasonalAdjustment?: number;
  }) => {
    if (!user) return;

    try {
      await analyticsService.updateForecastVariables(adjustments);
      // Regenerate forecast with new variables
      await generateForecast(selectedPeriod);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update forecast variables';
      showError('Update Error', errorMessage);
    }
  }, [user, selectedPeriod, generateForecast, showError]);

  // Adhoc Expense Methods
  const addAdhocExpense = useCallback(async (expense: Omit<AdhocExpense, 'id'>) => {
    if (!user) return;

    try {
      const response = await analyticsService.addAdhocExpense(expense);
      await fetchAdhocExpenses();
      await generateForecast(selectedPeriod); // Refresh forecast
      showSuccess('Expense Added', 'Adhoc expense added successfully');
      return response.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add expense';
      showError('Add Error', errorMessage);
    }
  }, [user, selectedPeriod, generateForecast, showError, showSuccess]);

  const updateAdhocExpense = useCallback(async (id: string, expense: Partial<AdhocExpense>) => {
    if (!user) return;

    try {
      await analyticsService.updateAdhocExpense(id, expense);
      await fetchAdhocExpenses();
      await generateForecast(selectedPeriod); // Refresh forecast
      showSuccess('Expense Updated', 'Adhoc expense updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update expense';
      showError('Update Error', errorMessage);
    }
  }, [user, selectedPeriod, generateForecast, showError, showSuccess]);

  const deleteAdhocExpense = useCallback(async (id: string) => {
    if (!user) return;

    try {
      await analyticsService.deleteAdhocExpense(id);
      await fetchAdhocExpenses();
      await generateForecast(selectedPeriod); // Refresh forecast
      showSuccess('Expense Deleted', 'Adhoc expense removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete expense';
      showError('Delete Error', errorMessage);
    }
  }, [user, selectedPeriod, generateForecast, showError, showSuccess]);

  const fetchAdhocExpenses = useCallback(async () => {
    if (!user) return;

    try {
      const response = await analyticsService.getAdhocExpenses();
      setAdhocExpenses(response.expenses);
    } catch (err) {
      console.error('Failed to fetch adhoc expenses:', err);
    }
  }, [user]);

  // Analytics Methods
  const fetchSpendingTrends = useCallback(async (filters: {
    dateRange: CustomDateRange;
    categories?: string[];
  }) => {
    if (!user) return;

    try {
      const response = await analyticsService.getSpendingTrends(filters);
      setSpendingTrends(response.trends);
    } catch (err) {
      console.error('Failed to fetch spending trends:', err);
    }
  }, [user]);

  const fetchBudgetVariance = useCallback(async (filters: {
    dateRange: CustomDateRange;
  }) => {
    if (!user) return;

    try {
      const response = await analyticsService.getBudgetVariance(filters);
      setBudgetVariances(response.variances);
    } catch (err) {
      console.error('Failed to fetch budget variance:', err);
    }
  }, [user]);

  const fetchFinancialHealth = useCallback(async () => {
    if (!user) return;

    try {
      const response = await analyticsService.getFinancialHealth();
      setFinancialHealth(response.indicators);
    } catch (err) {
      console.error('Failed to fetch financial health:', err);
    }
  }, [user]);

  const fetchCashFlowProjection = useCallback(async (months: number = 12) => {
    if (!user) return;

    try {
      const response = await analyticsService.getCashFlowProjection(months);
      setCashFlowProjections(response.projections);
    } catch (err) {
      console.error('Failed to fetch cash flow projection:', err);
    }
  }, [user]);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;

    try {
      const response = await analyticsService.getAnalyticsAlerts();
      setAlerts(response.alerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  }, [user]);

  const markAlertAsRead = useCallback(async (alertId: string) => {
    try {
      await analyticsService.markAlertAsRead(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  }, []);

  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      await analyticsService.dismissAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  }, []);

  // Export Methods
  const exportReport = useCallback(async (options: {
    format: 'pdf' | 'excel' | 'csv';
    dateRange: CustomDateRange;
    includeCharts?: boolean;
    includeForecasts?: boolean;
  }) => {
    if (!user) return;

    try {
      const response = await analyticsService.exportReport({
        ...options,
        includeCharts: options.includeCharts ?? true,
        includeForecasts: options.includeForecasts ?? true,
        includeAlerts: false,
      });

      showSuccess('Export Ready', 'Your report is ready for download');
      return response.downloadUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export report';
      showError('Export Error', errorMessage);
    }
  }, [user, showError, showSuccess]);

  // Initialize data on mount
  useEffect(() => {
    if (user) {
      generateForecast(12);
      fetchAdhocExpenses();
      fetchFinancialHealth();
      fetchCashFlowProjection();
      fetchAlerts();
    }
  }, [user]);

  return {
    // State
    loading,
    error,
    forecast,
    forecastAccuracy,
    selectedPeriod,
    adhocExpenses,
    spendingTrends,
    budgetVariances,
    financialHealth,
    cashFlowProjections,
    alerts,

    // Forecasting Methods
    generateForecast,
    updateForecastVariables,

    // Adhoc Expense Methods
    addAdhocExpense,
    updateAdhocExpense,
    deleteAdhocExpense,
    fetchAdhocExpenses,

    // Analytics Methods
    fetchSpendingTrends,
    fetchBudgetVariance,
    fetchFinancialHealth,
    fetchCashFlowProjection,
    fetchAlerts,
    markAlertAsRead,
    dismissAlert,

    // Export Methods
    exportReport,

    // Utility
    clearError: () => setError(null),
  };
}